const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const mongoose = require("mongoose");
const { getBlockStatuses, hideUserProfile } = require("../utils/blocking");
const { formatReactions } = require("../utils/reactions");
const { sanitizeUserForViewer } = require("../utils/privacy");
const { redisClient } = require("../config/redis");

// ============================================================
// GET MESSAGES
// ============================================================

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    // Check conversation exists
    const conversation = await Conversation.findById(
      conversationId
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // Check current user belongs to conversation
    const isParticipant = conversation.participants.some(
      (participant) =>
        String(participant) === String(req.userId)
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not a participant of this conversation",
      });
    }
     // REDIS CACHE

    const cacheKey = `messages:${conversationId}`;
    const cachedMessages = await redisClient.get(cacheKey);
    let messages;
    let source = "mongodb";

    if (cachedMessages) {
      console.log(`Redis cache HIT: ${cacheKey}`);
      messages = JSON.parse(cachedMessages);
      source = "redis";
    } else {
      console.log(`Redis cache MISS: ${cacheKey}`);
      messages = await Message.find({ conversationId })
        .populate(
          "sender",
          "fullName email phoneNumber avatar status lastSeen privacy"
        )
        .sort({ createdAt: 1 });
    }

    const senderIds = [...new Set(messages
      .map((message) => String(message.sender?._id || message.sender || ""))
      .filter(Boolean))];
    const currentSenders = await User.find({ _id: { $in: senderIds } })
      .select("fullName email phoneNumber avatar status lastSeen privacy")
      .lean();
    const sendersById = new Map(
      currentSenders.map((sender) => [String(sender._id), sender])
    );
    const otherUserIds = conversation.participants
      .filter((participant) => String(participant) !== String(req.userId))
      .map(String);
    const blockStatuses = await getBlockStatuses(req.userId, otherUserIds);



    const safeMessages = messages.map((message) => {
      const safeMessage = typeof message.toObject === "function"
        ? message.toObject()
        : { ...message };
      const senderId = String(safeMessage.sender?._id || safeMessage.sender || "");
      const senderStatus = blockStatuses.get(senderId);
      const currentSender = sendersById.get(senderId);
      safeMessage.reactions = formatReactions(safeMessage.reactions, req.userId);
      if (currentSender) {
        safeMessage.sender = sanitizeUserForViewer(
          currentSender,
          req.userId,
          true
        );
      }

      if (senderStatus?.blockedMe) {
        safeMessage.sender = hideUserProfile(safeMessage.sender);
      }

      return safeMessage;
    });
     // SAVE TO REDIS

    if (!cachedMessages) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(safeMessages));
      console.log(`Messages cached in Redis: ${cacheKey}`);
    }

    return res.status(200).json({
      messages: safeMessages,
      source,
    });
  } catch (error) {
    console.error(
      "Get messages error:",
      error
    );

    return res.status(500).json({
      message: "Failed to load messages",
      error: error.message,
    });
  }
};

// ============================================================
// SEND MESSAGE
// ============================================================

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        message: "Conversation ID is required",
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Message text is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findById(
      conversationId
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // Check participant
    const isParticipant = conversation.participants.some(
      (participant) =>
        String(participant) === String(req.userId)
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not a participant of this conversation",
      });
    }

    const otherUserIds = conversation.participants
      .filter((participant) => String(participant) !== String(req.userId))
      .map(String);
    const blockStatuses = await getBlockStatuses(req.userId, otherUserIds);
    if (otherUserIds.some((otherUserId) => blockStatuses.get(otherUserId)?.isBlocked)) {
      return res.status(403).json({
        message: "You cannot message this user while a block is active",
      });
    }

    const message = await Message.create({
      conversationId,
      sender: req.userId,
      text: text.trim(),
      messageType: "text",
    });

    // Populate sender
    const populatedMessage = await Message.findById(
      message._id
    ).populate(
      "sender",
      "fullName email phoneNumber avatar status lastSeen privacy"
    );

    populatedMessage.sender = sanitizeUserForViewer(
      populatedMessage.sender,
      req.userId,
      true
    );

    return res.status(201).json({
      message: populatedMessage,
    });
  } catch (error) {
    console.error(
      "Send message error:",
      error
    );

    return res.status(500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
};