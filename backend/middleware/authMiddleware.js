
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Session = require("../models/Session");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (
      !decoded.userId ||
      !decoded.sessionId ||
      !mongoose.isValidObjectId(decoded.sessionId)
    ) {
      return res.status(401).json({
        message: "Invalid session. Please log in again.",
      });
    }

    const session = await Session.findOne({
      _id: decoded.sessionId,
      userId: decoded.userId,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(401).json({
        message: "Session expired or revoked. Please log in again.",
      });
    }

    req.userId = decoded.userId;
    req.sessionId = decoded.sessionId;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = protect;