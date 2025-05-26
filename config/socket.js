// server/socket.js
const db = require('./db');

// This map helps track users and their associated sockets (for potentially multiple connections per user)
// Key: username, Value: Set<socket.id>
const connectedUsers = new Map();

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // --- NEW: Handle user registration on connection ---
        socket.on('registerUser', (username) => {
            if (!username) {
                console.warn(`Socket ${socket.id} tried to register without a username.`);
                return socket.emit('error', 'Username is required for chat.');
            }

            // Ensure the user joins their dedicated room
            socket.join(username);
            console.log(`Server: User '${username}' (Socket ID: ${socket.id}) joined room '${username}'.`);

            // Store the user's active sockets
            if (!connectedUsers.has(username)) {
                connectedUsers.set(username, new Set());
            }
            connectedUsers.get(username).add(socket.id);
            console.log(`Server: User '${username}' now has ${connectedUsers.get(username).size} active connections.`);
            // Optional: Broadcast online status to all users (if you have a general chat lobby or friends list)
            // io.emit('userStatusUpdate', { username: username, status: 'online' });
        });

        // --- Existing: Initial Message Retrieval ---
        socket.on('requestMessages', async (username) => {
            if (!username) {
                return socket.emit('error', 'Username is required to request messages.');
            }
            try {
                // Ensure the user has registered their socket with a username before fetching messages
                // This prevents issues if 'requestMessages' is emitted before 'registerUser'
                if (!socket.rooms.has(username)) {
                    // This is a safety check. Ideally, 'registerUser' is called first.
                    socket.join(username);
                    if (!connectedUsers.has(username)) {
                        connectedUsers.set(username, new Set());
                    }
                    connectedUsers.get(username).add(socket.id);
                    console.warn(`Server: User '${username}' had to join room on requestMessages (should be registered first).`);
                }

                const messages = await db('messages')
                    .select(
                        'id', 'sender_id', 'receiver_id', 'message', 'created_at',
                        'read_at', 'is_read', 'is_edited', 'is_deleted'
                    )
                    .where('sender_id', username)
                    .orWhere('receiver_id', username)
                    .orderBy('created_at', 'asc');

                // Send initial messages ONLY to the requesting socket
                socket.emit('initialMessages', messages);
                console.log(`Server: Sent ${messages.length} initial messages to ${username} (socket: ${socket.id}).`);
            } catch (err) {
                console.error('Server: Error fetching initial messages for user ' + username + ':', err);
                socket.emit('error', 'Failed to fetch messages.');
            }
        });

        // --- Core Fix: Targeted Message Emitting ---
        socket.on('sendMessage', async (data) => {
            const { sender_id, receiver_id, message } = data;

            if (!sender_id || !receiver_id || !message) {
                return socket.emit('error', 'Sender, receiver, and message are required.');
            }

            try {
                // Ensure sender's socket is indeed registered (safety check)
                if (!socket.rooms.has(sender_id)) {
                    console.warn(`Server: Sender ${sender_id} sent message but their socket was not in their room. Adding now.`);
                    socket.join(sender_id);
                    if (!connectedUsers.has(sender_id)) {
                        connectedUsers.set(sender_id, new Set());
                    }
                    connectedUsers.get(sender_id).add(socket.id);
                }

                const [newMessage] = await db('messages')
                    .insert({ sender_id, receiver_id, message }) // Shorthand for object property assignment
                    .returning([
                        'id', 'sender_id', 'receiver_id', 'message', 'created_at',
                        'read_at', 'is_read', 'is_edited', 'is_deleted'
                    ]);

                // Emit to sender's room (all connections for this sender)
                io.to(sender_id).emit('newMessage', newMessage);
                console.log(`Server: Emitted 'newMessage' to sender room '${sender_id}' (ID: ${newMessage.id}).`);

                // Emit to receiver's room (all connections for this receiver), if different from sender
                if (sender_id !== receiver_id) {
                    io.to(receiver_id).emit('newMessage', newMessage);
                    console.log(`Server: Emitted 'newMessage' to receiver room '${receiver_id}' (ID: ${newMessage.id}).`);
                }

            } catch (err) {
                console.error('Server: Error inserting message:', err);
                socket.emit('error', 'Failed to send message.');
            }
        });

        // --- Edit Message ---
        socket.on('editMessage', async (data) => {
            const { message_id, new_message, editor_id } = data;

            if (!message_id || !new_message || !editor_id) {
                return socket.emit('error', 'Message ID, new message, and editor ID are required for editing.');
            }

            try {
                const messageCheck = await db('messages')
                    .select('sender_id', 'receiver_id')
                    .where('id', message_id)
                    .first();

                if (!messageCheck || messageCheck.sender_id !== editor_id) {
                    return socket.emit('error', 'You are not authorized to edit this message or message not found.');
                }

                const [editedMessage] = await db('messages')
                    .where('id', message_id)
                    .update({
                        message: new_message,
                        is_edited: true,
                        created_at: db.fn.now() // Update timestamp on edit
                    })
                    .returning([
                        'id', 'sender_id', 'receiver_id', 'message', 'created_at',
                        'read_at', 'is_read', 'is_edited', 'is_deleted'
                    ]);

                if (editedMessage) {
                    // Emit to both original sender and receiver's rooms
                    io.to(editedMessage.sender_id).emit('messageEdited', editedMessage);
                    if (editedMessage.sender_id !== editedMessage.receiver_id) {
                        io.to(editedMessage.receiver_id).emit('messageEdited', editedMessage);
                    }
                    console.log(`Server: Emitted 'messageEdited' for message ${message_id}.`);
                } else {
                    socket.emit('error', 'Message not found for editing.');
                }
            } catch (err) {
                console.error('Server: Error editing message:', err);
                socket.emit('error', 'Failed to edit message.');
            }
        });

        // --- Delete Message ---
        socket.on('deleteMessage', async (data) => {
            const { message_id, deleter_id } = data;

            if (!message_id || !deleter_id) {
                return socket.emit('error', 'Message ID and deleter ID are required for deletion.');
            }

            try {
                const messageCheck = await db('messages')
                    .select('sender_id', 'receiver_id')
                    .where('id', message_id)
                    .first();

                if (!messageCheck || messageCheck.sender_id !== deleter_id) {
                    return socket.emit('error', 'You are not authorized to delete this message or message not found.');
                }

                const [deletedMessage] = await db('messages')
                    .where('id', message_id)
                    .update({
                        is_deleted: true,
                        message: 'This message has been deleted.',
                        created_at: db.fn.now() // Update timestamp on delete
                    })
                    .returning([
                        'id', 'sender_id', 'receiver_id', 'message', 'created_at',
                        'read_at', 'is_read', 'is_edited', 'is_deleted'
                    ]);

                if (deletedMessage) {
                    // Emit to both original sender and receiver's rooms
                    io.to(deletedMessage.sender_id).emit('messageDeleted', deletedMessage);
                    if (deletedMessage.sender_id !== deletedMessage.receiver_id) {
                        io.to(deletedMessage.receiver_id).emit('messageDeleted', deletedMessage);
                    }
                    console.log(`Server: Emitted 'messageDeleted' for message ${message_id}.`);
                } else {
                    socket.emit('error', 'Message not found for deletion.');
                }
            } catch (err) {
                console.error('Server: Error deleting message:', err);
                socket.emit('error', 'Failed to delete message.');
            }
        });

        // --- Mark Message as Read ---
        socket.on('markAsRead', async (data) => {
            const { message_id, reader_id } = data;

            if (!message_id || !reader_id) {
                return socket.emit('error', 'Message ID and reader ID are required to mark as read.');
            }

            try {
                const messageCheck = await db('messages')
                    .select('sender_id', 'receiver_id')
                    .where('id', message_id)
                    .first();

                if (!messageCheck || messageCheck.receiver_id !== reader_id) {
                    return socket.emit('error', 'You are not the intended recipient of this message or message not found.');
                }

                // Only update if not already read
                const [updatedMessage] = await db('messages')
                    .where('id', message_id)
                    .andWhere('is_read', false)
                    .update({
                        is_read: true,
                        read_at: db.fn.now()
                    })
                    .returning([
                        'id', 'sender_id', 'receiver_id', 'message', 'created_at',
                        'read_at', 'is_read', 'is_edited', 'is_deleted'
                    ]);

                if (updatedMessage) {
                    // Emit 'messageRead' to both the original sender AND receiver of the message
                    io.to(updatedMessage.sender_id).emit('messageRead', updatedMessage);
                    if (updatedMessage.sender_id !== updatedMessage.receiver_id) {
                        io.to(updatedMessage.receiver_id).emit('messageRead', updatedMessage);
                    }
                    console.log(`Server: Emitted 'messageRead' for message ${message_id} by ${reader_id}.`);
                }
            } catch (err) {
                console.error('Server: Error marking message as read:', err);
                socket.emit('error', 'Failed to mark message as read.');
            }
        });

        socket.on('disconnect', () => {
            console.log('Server: User disconnected:', socket.id);
            // Remove socket from connectedUsers map
            for (let [user, sockets] of connectedUsers.entries()) {
                if (sockets.has(socket.id)) {
                    sockets.delete(socket.id);
                    if (sockets.size === 0) {
                        connectedUsers.delete(user);
                        // Optional: broadcast offline status
                        // io.emit('userStatusUpdate', { username: user, status: 'offline' });
                    }
                    break;
                }
            }
            console.log(`Server: Socket ${socket.id} disconnected. Remaining users:`, Array.from(connectedUsers.keys()));
        });
    });
};