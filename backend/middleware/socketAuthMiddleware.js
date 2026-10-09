const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Session = require("../models/Session");

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded.userId || !mongoose.isValidObjectId(decoded.sessionId)) {
      return next(new Error("Invalid session. Please log in again."));
    }

    const session = await Session.findOne({
      _id: decoded.sessionId,
      userId: decoded.userId,
      revoked: false,
      expiresAt: { $gt: new Date() },
    }).select("_id");

    if (!session) {
      return next(new Error("Session expired or revoked. Please log in again."));
    }

    socket.userId = decoded.userId;
    socket.sessionId = String(session._id);

    next();
  } catch (error) {
    console.error("Socket authentication error:", error);

    next(new Error("Invalid or expired token"));
  }
};

module.exports = socketAuthMiddleware;