const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { Chat } = require("../models/chat");
const isConnected = require("../utils/isConnected");
const ConnectionRequest = require("../models/connectionRequest");

const chatRouter = express.Router();

// Unread message count per connection: { [otherUserId]: count }
// (must be above "/chat/:targetUserId", or "unread" would be read as an id)
chatRouter.get("/chat/unread", userAuth, async (req, res) => {
  const userId = req.user._id.toString();

  try {
    // Only chats with current connections count (old chats with removed
    // connections can't be opened, so they'd stay unread forever)
    const connections = await ConnectionRequest.find({
      status: "accepted",
      $or: [{ fromUserId: userId }, { toUserId: userId }],
    })
      .select("fromUserId toUserId")
      .lean();
    const connectionIds = connections.map(({ fromUserId, toUserId }) =>
      fromUserId.toString() === userId ? toUserId : fromUserId
    );

    const chats = await Chat.find({
      participants: { $all: [userId], $in: connectionIds },
    })
      .select("participants lastRead messages.senderId messages.createdAt")
      .lean();

    const counts = {};
    chats.forEach((chat) => {
      const otherId = chat.participants.find((id) => id.toString() !== userId);
      const lastRead = chat.lastRead?.[userId];

      // Messages from the other person that came after I last read the chat
      const unread = chat.messages.filter(
        (m) =>
          m.senderId.toString() !== userId &&
          (!lastRead || m.createdAt > lastRead)
      ).length;

      if (otherId && unread > 0) counts[otherId.toString()] = unread;
    });

    res.json({ data: counts });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user._id;

  try {
    // Only connected users (accepted request) can chat
    if (!(await isConnected(userId, targetUserId))) {
      return res
        .status(403)
        .json({ message: "You can only chat with your connections" });
    }

    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    }).populate({
      path: "messages.senderId",
      select: "firstName lastName",
    });
    if (!chat) {
      chat = new Chat({
        participants: [userId, targetUserId],
        messages: [],
      });
      await chat.save();
    }
    res.json(chat);
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = chatRouter;
