const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const mongoose = require("mongoose");
const { getBlockStatuses, hideUserProfile } = require("../utils/blocking");
const { sanitizeUserForViewer } = require("../utils/privacy");

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId,
    })
      .populate(
        "participants",
        "fullName email phoneNumber avatar status lastSeen privacy"
      )
      .sort({
        updatedAt: -1,
      });

    const conversationIds = conversations.map((conversation) => conversation._id);
    const latestMessages = conversationIds.length
      ? await Message.aggregate([
          {
            $match: {
              conversationId: { $in: conversationIds },
              deletedFor: { $ne: new mongoose.Types.ObjectId(req.userId) },
            },
          },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: "$conversationId",
              message: {
                $first: {
                  _id: "$_id",
                  text: "$text",
                  sender: "$sender",
                  createdAt: "$createdAt",
                  messageType: "$messageType",
                  deletedForEveryone: "$deletedForEveryone",
                },
              },
            },
          },
        ])
      : [];
    const latestMessagesByConversation = new Map(
      latestMessages.map(({ _id, message }) => [
        String(_id),
        {
          ...message,
          authorId: String(message.sender),
          text: message.deletedForEveryone
            ? "This message was deleted"
            : message.text || (message.messageType === "image" ? "Photo" : ""),
        },
      ])
    );

    const otherUserIds = conversations.flatMap((conversation) =>
      conversation.participants
        .filter((participant) => String(participant._id) !== String(req.userId))
        .map((participant) => String(participant._id))
    );
    const blockStatuses = await getBlockStatuses(req.userId, otherUserIds);
    const safeConversations = conversations.map((conversation) => {
      const safeConversation = conversation.toObject();
      safeConversation.lastMessage =
        latestMessagesByConversation.get(String(conversation._id)) || null;
      const otherParticipant = safeConversation.participants.find(
        (participant) => String(participant._id) !== String(req.userId)
      );
      const status = blockStatuses.get(String(otherParticipant?._id)) || {};

      safeConversation.blockedByMe = Boolean(status.blockedByMe);
      safeConversation.blockedMe = Boolean(status.blockedMe);
      safeConversation.isBlocked = Boolean(status.isBlocked);

      safeConversation.participants = safeConversation.participants.map((participant) => {
        const visibleParticipant = sanitizeUserForViewer(
          participant,
          req.userId,
          true
        );

        return status.blockedMe &&
          String(participant._id) === String(otherParticipant?._id)
          ? hideUserProfile(visibleParticipant)
          : visibleParticipant;
      });

      return safeConversation;
    });

    return res.status(200).json({
      conversations: safeConversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      message: "Failed to load conversations",
      error: error.message,
    });
  }
};

exports.createOrGetConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    console.log("Current user:", req.userId);
    console.log("Selected user:", userId);

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (String(userId) === String(req.userId)) {
      return res.status(400).json({
        message: "You cannot create conversation with yourself",
      });
    }

    const selectedUser = await User.findById(userId);

    if (!selectedUser) {
      return res.status(404).json({
        message: "Selected user not found",
      });
    }

    const blockStatus = (await getBlockStatuses(req.userId, [userId])).get(
      String(userId)
    );
    if (blockStatus?.isBlocked) {
      return res.status(403).json({
        message: "Unblock this user before starting a conversation",
      });
    }

    let conversation = await Conversation.findOne({
      participants: {
        $all: [
          new mongoose.Types.ObjectId(req.userId),
          new mongoose.Types.ObjectId(userId),
        ],
      },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [
          new mongoose.Types.ObjectId(req.userId),
          new mongoose.Types.ObjectId(userId),
        ],
      });

      console.log(
        "NEW CONVERSATION CREATED:",
        conversation._id
      );
    }

    conversation = await Conversation.findById(
      conversation._id
    ).populate(
      "participants",
      "fullName email phoneNumber avatar status lastSeen privacy"
    );

    const safeConversation = conversation.toObject();
    safeConversation.participants = safeConversation.participants.map((participant) =>
      sanitizeUserForViewer(participant, req.userId, true)
    );

    return res.status(200).json({
      message: "Conversation ready",
      conversation: safeConversation,
    });

  } catch (error) {
    console.error("Create conversation error:", error);

    return res.status(500).json({
      message: "Failed to create conversation",
      error: error.message,
    });
  }
};