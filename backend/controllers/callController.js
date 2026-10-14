const mongoose = require("mongoose");
const Call = require("../models/Call");

const MISSED_CALL_TIMEOUT_MS = 30 * 1000;

exports.getCallHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const staleCallCutoff = new Date(Date.now() - MISSED_CALL_TIMEOUT_MS);

    await Call.updateMany(
      {
        receiver: userId,
        status: "ringing",
        startedAt: { $lte: staleCallCutoff },
      },
      {
        $set: {
          status: "missed",
          endedAt: new Date(),
          durationSeconds: 0,
        },
      }
    );

    const calls = await Call.find({
      $or: [{ caller: userId }, { receiver: userId }],
    })
      .populate("caller", "fullName avatar")
      .populate("receiver", "fullName avatar")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({ calls });
  } catch (error) {
    console.error("Get call history error:", error);
    return res.status(500).json({ message: "Failed to load call history" });
  }
};
