const socket = require("socket.io");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { Chat } = require("../models/chat");
const { getCorsOptions } = require("../config/security");
const isConnected = require("./isConnected");
const ConnectionRequestModel = require("../models/connectionRequest");

// Ids of everyone this user has an accepted connection with
const getConnectionIds = async (userId) => {
  const connections = await ConnectionRequestModel.find({
    status: "accepted",
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  }).select("fromUserId toUserId");

  return connections.map((c) =>
    c.fromUserId.toString() === userId
      ? c.toUserId.toString()
      : c.fromUserId.toString()
  );
};

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
  const io = socket(server, { cors: getCorsOptions() });

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

    // A user is online while their personal room has at least one socket (tab)
    const isOnline = (id) => io.sockets.adapter.rooms.has("user:" + id);

    // Tell this user's connections that they came online / went offline
    const broadcastPresence = async (online) => {
      try {
        const ids = await getConnectionIds(userId);
        ids.forEach((id) =>
          io.to("user:" + id).emit("presence", { userId, online })
        );
      } catch (err) {}
    };

    // First tab opened → now online
    if (io.sockets.adapter.rooms.get("user:" + userId)?.size === 1) {
      broadcastPresence(true);
    }

    // Client asks which of its connections are online right now (with ack)
    socket.on("getOnlineConnections", async (callback) => {
      if (typeof callback !== "function") return;
      try {
        const ids = await getConnectionIds(userId);
        callback(ids.filter(isOnline));
      } catch (err) {
        callback([]);
      }
    });

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

    // Rooms are already left here, so an empty personal room = last tab closed
    socket.on("disconnect", () => {
      if (!isOnline(userId)) broadcastPresence(false);
    });
  });
};

module.exports = initializeSocket;
