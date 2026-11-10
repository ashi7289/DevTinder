const mongoose = require("mongoose");
const ConnectionRequestModel = require("../models/connectionRequest");

// true only if the two users have an "accepted" connection (in either direction)
const isConnected = async (userId, targetUserId) => {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) return false;

  const connection = await ConnectionRequestModel.exists({
    status: "accepted",
    $or: [
      { fromUserId: userId, toUserId: targetUserId },
      { fromUserId: targetUserId, toUserId: userId },
    ],
  });

  return !!connection;
};

module.exports = isConnected;
