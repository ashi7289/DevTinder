const socket = require("socket.io");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { Chat } = require("../models/chat");
const isConnected = require("./isConnected");

const getSecretRoomId = (userId, targetUserId) => {
  return crypto
    .createHash("sha256")
    .update([userId, targetUserId].sort().join("_"))
    .digest("hex");
};

// Read the "token" cookie from the socket handshake headers
const getTokenFromCookie = (cookieHeader = "") => {
  const tokenCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("token="));
  return tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1]) : null;
};

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  // Auth middleware: runs once for every new socket connection
  io.use(async (socket, next) => {
    try {
      const token = getTokenFromCookie(socket.handshake.headers.cookie);
      if (!token) {
        return next(new Error("Please Login!"));
      }

      const { _id } = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(_id);
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user; // logged-in user, available in all events
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    const { firstName, lastName } = socket.user;

    // Personal room: reaches every open tab of this user (for unread counts)
    socket.join("user:" + userId);

    socket.on("joinChat", async ({ targetUserId }) => {
      try {
        // Not connected → don't let them into the room
        if (!(await isConnected(userId, targetUserId))) {
          return socket.emit("chatError", {
            message: "You can only chat with your connections",
          });
        }
        const roomId = getSecretRoomId(userId, targetUserId);
        socket.join(roomId);
      } catch (err) {}
    });

    socket.on("sendMessage", async ({ targetUserId, text }) => {
      // Save messages to the database
      try {
        // Not connected → don't save or send the message
        if (!(await isConnected(userId, targetUserId))) {
          return socket.emit("chatError", {
            message: "You can only chat with your connections",
          });
        }

        const roomId = getSecretRoomId(userId, targetUserId);

        let chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });

        if (!chat) {
          chat = new Chat({
            participants: [userId, targetUserId],
            messages: [],
          });
        }

        chat.messages.push({
          senderId: userId,
          text,
        });

        await chat.save();

        const savedMessage = chat.messages[chat.messages.length - 1];
        // Bump the receiver's unread count, wherever they are in the app
        io.to("user:" + targetUserId).emit("newMessage", { fromUserId: userId });

        io.to(roomId).emit("messageReceived", {
          senderId: userId,
          firstName,
          lastName,
          text,
          createdAt: savedMessage.createdAt,
        });
      } catch (err) {
      }
    });

    // The user has read this chat up to now
    socket.on("markRead", async ({ targetUserId }) => {
      try {
        const readAt = new Date();

        // Only updates a chat the user is part of, and only their own lastRead
        const { matchedCount } = await Chat.updateOne(
          { participants: { $all: [userId, targetUserId] } },
          { $set: { ["lastRead." + userId]: readAt } }
        );
        if (!matchedCount) return;

        // Tell the other person so their "Seen" updates live
        const roomId = getSecretRoomId(userId, targetUserId);
        socket.to(roomId).emit("messagesRead", { userId, readAt });

        // Clear the unread count in all of my tabs
        io.to("user:" + userId).emit("chatRead", { targetUserId });
      } catch (err) {}
    });

    socket.on("disconnect", () => {});
  });
};

module.exports = initializeSocket;
