const socket = require("socket.io");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

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

    socket.on("joinChat", ({ targetUserId }) => {
      const roomId = getSecretRoomId(userId, targetUserId);
      console.log(firstName + " joined " + roomId);
      socket.join(roomId);
    });

    socket.on("sendMessage", ({ targetUserId, text }) => {
      const roomId = getSecretRoomId(userId, targetUserId);
      console.log(firstName + " " + text);

      io.to(roomId).emit("messageReceived", { firstName, lastName, text });
    });

    socket.on("disconnect", () => {});
  });
};

module.exports = initializeSocket;
