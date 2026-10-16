const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const mongoose = require("mongoose");
const { getBlockStatuses, hideUserProfile } = require("../utils/blocking");
const { formatReactions } = require("../utils/reactions");
const { sanitizeUserForViewer } = require("../utils/privacy");
const {
  getCacheValue,
  setCacheValue,
  invalidateCache,
} = require("../config/redis");
const fs = require("fs/promises");
const path = require("path");

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
    const cachedMessages = await getCacheValue(cacheKey);

    let messages;
    let source = "mongodb";

    if (cachedMessages) {
      console.log(`Redis cache HIT: ${cacheKey}`);
      messages = JSON.parse(cachedMessages);
      source = "redis";
    } else {
      console.log(`Redis cache MISS: ${cacheKey}`);

      messages = await Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .lean();

      const cached = await setCacheValue(
        cacheKey,
        300,
        JSON.stringify(messages)
      );

      if (cached) {
        console.log(`Messages cached in Redis: ${cacheKey}`);
      }
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
    }).filter((message) =>
      !message.deletedFor?.some(
        (deletedUserId) =>
          String(deletedUserId?._id || deletedUserId) === String(req.userId)
      )
    );
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
  // Remove uploaded files if the message cannot be saved.
  const cleanupUploadedFiles = async () => {
    const files = req.files || [];

    await Promise.all(
      files.map((file) =>
        fs.unlink(file.path).catch(() => {})
      )
    );
  };

  try {
    const { conversationId } = req.body;
    const text = typeof req.body.text === "string"
      ? req.body.text.trim()
      : "";

    const files = req.files || [];

    // Require text or at least one image.
    if (!text && files.length === 0) {
      return res.status(400).json({
        message: "Message text or at least one image is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      await cleanupUploadedFiles();

      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findById(
      conversationId
    );

    if (!conversation) {
      await cleanupUploadedFiles();

      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // Check whether the sender belongs to this conversation.
    const isParticipant = conversation.participants.some(
      (participant) =>
        String(participant) === String(req.userId)
    );

    if (!isParticipant) {
      await cleanupUploadedFiles();

      return res.status(403).json({
        message: "You are not a participant of this conversation",
      });
    }

    // Preserve the existing block restrictions.
    const otherUserIds = conversation.participants
      .filter(
        (participant) => String(participant) !== String(req.userId)
      )
      .map(String);

    const blockStatuses = await getBlockStatuses(
      req.userId,
      otherUserIds
    );

    if (
      otherUserIds.some(
        (otherUserId) =>
          blockStatuses.get(otherUserId)?.isBlocked
      )
    ) {
      await cleanupUploadedFiles();

      return res.status(403).json({
        message: "You cannot message this user while a block is active",
      });
    }

    // Store relative URLs so the backend host can change later.
    const images = files.map((file) => ({
      url: `/uploads/messages/${file.filename}`,
      originalName: path.basename(file.originalname),
      mimeType: file.mimetype,
      size: file.size,
    }));

    const messageType =
      images.length === 0
        ? "text"
        : text
          ? "mixed"
          : "image";

    const message = await Message.create({
      conversationId,
      sender: req.userId,
      text,
      messageType,
      images,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessageAt: new Date(),
    });

    // Invalidate cached conversation messages after saving.
    await invalidateCache(`messages:${conversationId}`);

    // Populate sender for the API response.
    const populatedMessage = await Message.findById(
      message._id
    ).populate(
      "sender",
      "fullName email phoneNumber avatar status lastSeen privacy"
    );

    let responseMessage;
    if (populatedMessage) {
      const messageData = populatedMessage.toObject();
      responseMessage = {
        ...messageData,
        sender: sanitizeUserForViewer(messageData.sender, req.userId, true),
      };
      const io = require("../socket/socket").io;
      if (io) {
        for (const participant of conversation.participants) {
          const participantId = String(participant);
          const messageForRecipient = { ...messageData };
          messageForRecipient.sender = sanitizeUserForViewer(
            messageForRecipient.sender,
            participantId,
            true
          );

          io.to(`user:${participantId}`).emit(
            "new_message",
            messageForRecipient
          );
        }
      }
    }

    return res.status(201).json({
      message: responseMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    await cleanupUploadedFiles();

    return res.status(500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
};