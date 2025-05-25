module.exports = (app, db, io) => {
  // Store online users
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("New client connected");

    // Handle user connection
    socket.on("user_connected", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} connected`);
    });

    // Handle new message
    socket.on("send_message", async (data) => {
      try {
        const { sender_id, receiver_id, message } = data;

        // Save message to database
        const newMessage = await db("messages")
          .insert({
            sender_id,
            receiver_id,
            message,
            created_at: new Date(),
            is_read: false,
            is_edited: false,
            is_deleted: false,
          })
          .returning("*");

        // Only emit to sender and receiver
        const senderSocketId = onlineUsers.get(sender_id);
        const receiverSocketId = onlineUsers.get(receiver_id);

        // Emit to sender if online
        if (senderSocketId) {
          io.to(senderSocketId).emit("message_sent", newMessage[0]);
        }

        // Emit to receiver if online
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("new_message", newMessage[0]);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle message read
    socket.on("message_read", async (data) => {
      try {
        const { message_ids, reader_id } = data;

        // Update messages in database
        await db("messages").whereIn("id", message_ids).update({
          is_read: true,
          read_at: new Date(),
        });

        // Get messages and their senders
        const messages = await db("messages")
          .whereIn("id", message_ids)
          .select("sender_id", "receiver_id");

        // Notify only the relevant users (sender and receiver)
        messages.forEach((message) => {
          const senderSocketId = onlineUsers.get(message.sender_id);
          const receiverSocketId = onlineUsers.get(message.receiver_id);

          if (senderSocketId) {
            io.to(senderSocketId).emit("messages_read", {
              message_ids,
              reader_id,
            });
          }
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("messages_read", {
              message_ids,
              reader_id,
            });
          }
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
        socket.emit("error", { message: "Failed to mark messages as read" });
      }
    });

    // Handle message edit
    socket.on("edit_message", async (data) => {
      try {
        const { message_id, new_message, editor_id } = data;

        // First check if the editor is the original sender
        const message = await db("messages").where("id", message_id).first();

        if (!message) {
          throw new Error("Message not found");
        }

        // Verify that the editor is the original sender
        if (message.sender_id !== editor_id) {
          socket.emit("error", {
            message: "Only the sender can edit this message",
          });
          return;
        }

        // Update message in database
        const updatedMessage = await db("messages")
          .where("id", message_id)
          .update({
            message: new_message,
            is_edited: true,
          })
          .returning("*");

        // Only notify sender and receiver
        const senderSocketId = onlineUsers.get(message.sender_id);
        const receiverSocketId = onlineUsers.get(message.receiver_id);

        if (senderSocketId) {
          io.to(senderSocketId).emit("message_edited", updatedMessage[0]);
        }
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("message_edited", updatedMessage[0]);
        }
      } catch (error) {
        console.error("Error editing message:", error);
        socket.emit("error", {
          message: error.message || "Failed to edit message",
        });
      }
    });

    // Handle message deletion
    socket.on("delete_message", async (data) => {
      try {
        const { message_id, deleter_id } = data;

        // Soft delete message in database
        await db("messages").where("id", message_id).update({
          is_deleted: true,
        });

        // Get the message details
        const message = await db("messages").where("id", message_id).first();

        // Only notify sender and receiver
        const senderSocketId = onlineUsers.get(message.sender_id);
        const receiverSocketId = onlineUsers.get(message.receiver_id);

        if (senderSocketId) {
          io.to(senderSocketId).emit("message_deleted", { message_id });
        }
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("message_deleted", { message_id });
        }
      } catch (error) {
        console.error("Error deleting message:", error);
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      // Remove user from online users
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });
};
