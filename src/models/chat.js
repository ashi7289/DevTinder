const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ],
  messages: [messageSchema],
  // When each participant last read this chat: { userId: Date }
  // A message is "seen" if it was sent before the other person's lastRead time
  lastRead: { type: Map, of: Date, default: {} },
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = { Chat };
