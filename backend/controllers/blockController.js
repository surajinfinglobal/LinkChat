const User = require("../models/User");
const mongoose = require("mongoose");
const setupSocket = require("../socket/socket");

const notifyBlockStatusChanged = (...userIds) => {
  [...new Set(userIds.map(String))].forEach((userId) => {
    setupSocket.io?.to(`user:${userId}`).emit("block_status_changed");
  });
};

exports.blockUser = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const targetUserId = req.params.userId;

    if (String(currentUserId) === String(targetUserId)) {
      return res.status(400).json({
        message: "You cannot block yourself",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      
      return res.status(404).json({
        message: "User not found",
      });
    }

    await User.findByIdAndUpdate(
      currentUserId,
      {
        $addToSet: {
          blockedUsers: targetUserId,
        },
      }
    );

    notifyBlockStatusChanged(currentUserId, targetUserId);

    return res.json({
      message: "User blocked successfully",
      blockedUserId: targetUserId,
    });
  } catch (error) {
    console.error("Block user error:", error);

    return res.status(500).json({
      message: "Unable to block user",
    });
  }
};
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate(
        "blockedUsers",
        "fullName email phoneNumber avatar"
      )
      .select("blockedUsers");

    res.json({
      blockedUsers: user?.blockedUsers || [],
    });
  } catch (error) {
    console.error("Get blocked users error:", error);

    res.status(500).json({
      message: "Unable to load blocked users",
    });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const targetUserId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    await User.findByIdAndUpdate(
      currentUserId,
      {
        $pull: {
          blockedUsers: targetUserId,
        },
      }
    );

    notifyBlockStatusChanged(currentUserId, targetUserId);

    return res.json({
      message: "User unblocked successfully",
      unblockedUserId: targetUserId,
    });
  } catch (error) {
    console.error("Unblock user error:", error);

    return res.status(500).json({
      message: "Unable to unblock user",
    });
  }
};