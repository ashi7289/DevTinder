const mongoose = require("mongoose");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");
const { Chat } = require("../models/chat");

// Permanently removes a user and everything that points to them,
// so no other user is left with broken references (null populates).
// Runs in a transaction: either everything is deleted or nothing is.
const deleteUserCompletely = async (userId) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Requests and connections sent by or to this user
      await ConnectionRequest.deleteMany(
        { $or: [{ fromUserId: userId }, { toUserId: userId }] },
        { session }
      );

      // Chats this user was part of
      await Chat.deleteMany({ participants: userId }, { session });

      await User.deleteOne({ _id: userId }, { session });
    });
  } finally {
    await session.endSession();
  }
};

module.exports = deleteUserCompletely;
