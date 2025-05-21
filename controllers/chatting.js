const chatting = (db) => {
  // Send a new message
  const sendMessage = async (req, res) => {
    const { sender_id, receiver_id, message } = req.body;

    try {
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

      res.json(newMessage[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to send message" });
    }
  };

  // Get messages between two users
  const getMessages = async (req, res) => {
    const { user1_id, user2_id } = req.body;

    try {
      const messages = await db("messages")
        .where(function () {
          this.where("sender_id", user1_id)
            .andWhere("receiver_id", user2_id)
            .orWhere(function () {
              this.where("sender_id", user2_id).andWhere(
                "receiver_id",
                user1_id
              );
            });
        })
        .where("is_deleted", false)
        .orderBy("created_at", "asc");

      res.json(messages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  };

  // Mark messages as read
  const markAsRead = async (req, res) => {
    const { message_ids } = req.body;

    try {
      await db("messages").whereIn("id", message_ids).update({
        is_read: true,
        read_at: new Date(),
      });

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  };

  // Edit message
  const editMessage = async (req, res) => {
    const { message_id, new_message } = req.body;

    try {
      const updatedMessage = await db("messages")
        .where("id", message_id)
        .update({
          message: new_message,
          is_edited: true,
        })
        .returning("*");

      res.json(updatedMessage[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to edit message" });
    }
  };

  // Delete message (soft delete)
  const deleteMessage = async (req, res) => {
    const { message_id } = req.body;

    try {
      await db("messages").where("id", message_id).update({
        is_deleted: true,
      });

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete message" });
    }
  };

  return {
    sendMessage,
    getMessages,
    markAsRead,
    editMessage,
    deleteMessage,
  };
};

// Export the function directly
module.exports = chatting;
