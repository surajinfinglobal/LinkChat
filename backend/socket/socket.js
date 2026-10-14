const { Server } = require("socket.io");
const User = require("../models/User");
const Call = require("../models/Call");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const socketAuthMiddleware = require("../middleware/socketAuthMiddleware");
const { getBlockStatuses } = require("../utils/blocking");
const { formatReactions } = require("../utils/reactions");
const { canView, getPrivacy, sanitizeUserForViewer } = require("../utils/privacy");
const { invalidateCache } = require("../config/redis");

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });
  setupSocket.io = io;

  // JWT authentication
  io.use(socketAuthMiddleware);

  // userId -> Set of socket IDs
  const connectedUsers = new Map();

  const updateMessageStatus = async (conversationId, senderId, status) => {
    if (status === "read") {
      const reader = await User.findById(senderId).select("privacy.readReceipts").lean();
      if (reader?.privacy?.readReceipts === false) return;
    }

    const messages = await Message.find({
      conversationId,
      sender: { $ne: senderId },
      status: status === "read" ? { $ne: "read" } : "sent",
    }).select("_id").lean();

    if (messages.length === 0) return;

    const messageIds = messages.map((message) => String(message._id));
    const statusFilter = status === "read"
      ? { $in: ["sent", "delivered"] }
      : "sent";
    const updateResult = await Message.updateMany(
      { _id: { $in: messageIds }, status: statusFilter },
      { $set: { status } }
    );
    if (updateResult.modifiedCount === 0) return;
    await invalidateCache(`messages:${conversationId}`);

    const conversation = await Conversation.findById(conversationId)
      .select("participants")
      .lean();
    conversation?.participants.forEach((participantId) => {
      io.to(`user:${participantId}`).emit("message_status_updated", {
        conversationId: String(conversationId),
        messageIds,
        status,
      });
    });
  };

  const emitVisibleUserStatus = async (changedUserId, data) => {
    const changedUser = await User.findById(changedUserId)
      .select("blockedUsers privacy")
      .lean();
    if (!changedUser) return;

    const privacy = getPrivacy(changedUser);
    const conversations = await Conversation.find({ participants: changedUserId })
      .select("participants")
      .lean();
    const contactIds = new Set(
      conversations.flatMap((conversation) => conversation.participants.map(String))
    );
    const excludedIds = [
      changedUserId,
      ...(changedUser?.blockedUsers || []),
    ];
    const recipients = await User.find({
      _id: { $nin: excludedIds },
      blockedUsers: { $ne: changedUserId },
    }).select("_id").lean();

    recipients.forEach((recipient) => {
      const isContact = contactIds.has(String(recipient._id));
      io.to(`user:${recipient._id}`).emit("user_status", {
        userId: String(changedUserId),
        status: privacy.onlineStatus ? data.status : "offline",
        lastSeen: canView(privacy.lastSeen, isContact) ? data.lastSeen : null,
      });
    });

    return recipients;
  };

  io.on("connection", async (socket) => {
    const userId = socket.userId.toString();

    socket.join(`session:${socket.sessionId}`);
    socket.join(`user:${userId}`);

console.log(
  `User joined room: user:${userId}`
);

    console.log("Socket connected:", socket.id);
    console.log("User:", userId);

    socket.on("privacy_settings_updated", async () => {
      try {
        const currentUser = await User.findById(userId)
          .select("status lastSeen")
          .lean();
        if (!currentUser) return;

        const recipients = await emitVisibleUserStatus(userId, {
          userId,
          status: currentUser.status,
          lastSeen: currentUser.lastSeen,
        });
        recipients.forEach((recipient) => {
          io.to(`user:${recipient._id}`).emit("user_privacy_updated", { userId });
        });
      } catch (error) {
        console.error("Privacy status refresh error:", error);
      }
    });

    // --------------------------------
    // Add socket to user's connections
    // --------------------------------

    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }

    const userSockets = connectedUsers.get(userId);

    const wasOffline = userSockets.size === 0;

    userSockets.add(socket.id);

    // --------------------------------
    // User became online
    // --------------------------------

    if (wasOffline) {
      try {
        await User.findByIdAndUpdate(userId, {
          status: "online",
          lastSeen: null,
        });

        console.log(`User ${userId} is ONLINE`);
      } catch (error) {
        console.error(
          "Online status update error:",
          error
        );
      }

      // Notify other clients
      await emitVisibleUserStatus(userId, {
        userId,
        status: "online",
        lastSeen: null,
      });

      const conversations = await Conversation.find({ participants: userId })
        .select("_id")
        .lean();
      for (const conversation of conversations) {
        await updateMessageStatus(conversation._id, userId, "delivered");
      }
    }


// ============================================================
// SEND MESSAGE
// ============================================================


    socket.on("join_conversation", async (conversationId) => {
      if (!conversationId) return;

      try {
        const conversation = await Conversation.findById(conversationId);
        const isParticipant = conversation?.participants.some(
          (participant) => String(participant) === userId
        );

        if (isParticipant) {
          socket.join(`conversation:${conversationId}`);
          await updateMessageStatus(conversationId, userId, "read");
        }
      } catch (error) {
        console.error("Conversation room join error:", error);
      }
    });
    // Delete message for the current user only
socket.on("delete_message_for_me", async ({ messageId, conversationId } = {}) => {
  try {
    if (!messageId || !conversationId) return;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) return;

    const isParticipant = conversation.participants.some(
      (participant) => String(participant._id || participant) === String(userId)
    );

    if (!isParticipant) {
      socket.emit("message_delete_error", {
        message: "You are not a participant in this conversation.",
        messageId: String(messageId),
        conversationId: String(conversationId),
      });
      return;
    }

    const message = await Message.findOne({
      _id: messageId,
      conversationId,
    });

    if (!message) {
      socket.emit("message_delete_error", {
        message: "Message not found.",
        messageId: String(messageId),
        conversationId: String(conversationId),
      });
      return;
    }

    await Message.updateOne(
      { _id: messageId, conversationId },
      { $addToSet: { deletedFor: userId } }
    );

    await invalidateCache(`messages:${conversationId}`);

    // Notify only the requesting user's devices
    io.to(`user:${userId}`).emit("message_deleted_for_me", {
      messageId: String(messageId),
      conversationId: String(conversationId),
    });
  } catch (error) {
    console.error("Delete message for me error:", error);

    socket.emit("message_delete_error", {
      message: "Failed to delete message.",
      messageId: String(messageId),
      conversationId: String(conversationId),
    });
  }
});


// Delete message for everyone (sender only)
socket.on(
  "delete_message_for_everyone",
  async ({ messageId, conversationId } = {}) => {
    try {
      if (!messageId || !conversationId) return;

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) return;

      const isParticipant = conversation.participants.some(
        (participant) =>
          String(participant._id || participant) === String(userId)
      );

      if (!isParticipant) {
        socket.emit("message_delete_error", {
          message: "You are not a participant in this conversation.",
          messageId: String(messageId),
          conversationId: String(conversationId),
        });
        return;
      }

      const message = await Message.findOne({
        _id: messageId,
        conversationId,
      });

      if (!message) {
        socket.emit("message_delete_error", {
          message: "Message not found.",
          messageId: String(messageId),
          conversationId: String(conversationId),
        });
        return;
      }

      const senderId = String(message.sender?._id || message.sender);

      if (senderId !== String(userId)) {
        socket.emit("message_delete_error", {
          message: "You can only delete your own messages for everyone.",
          messageId: String(messageId),
          conversationId: String(conversationId),
        });
        return;
      }

      if (message.deletedForEveryone) return;

      message.deletedForEveryone = true;
      message.deletedAt = new Date();
      message.text = "";
      message.images = [];

      await message.save();

      await invalidateCache(`messages:${conversationId}`);

      const payload = {
        messageId: String(messageId),
        conversationId: String(conversationId),
      };

      // Notify all participants, including the sender
      for (const participant of conversation.participants) {
        const participantId = String(participant._id || participant);

        io.to(`user:${participantId}`).emit(
          "message_deleted_for_everyone",
          payload
        );
      }
    } catch (error) {
      console.error("Delete message for everyone error:", error);

      socket.emit("message_delete_error", {
        message: "Failed to delete message for everyone.",
        messageId: String(messageId),
        conversationId: String(conversationId),
      });
    }
  }
);

    socket.on("mark_messages_read", async ({ conversationId } = {}) => {
      if (!conversationId || !socket.rooms.has(`conversation:${conversationId}`)) return;

      try {
        await updateMessageStatus(conversationId, userId, "read");
      } catch (error) {
        console.error("Mark messages read error:", error);
      }
    });

    // User started typing
    socket.on("typing", async ({ conversationId } = {}) => {
      if (!conversationId || !socket.rooms.has(`conversation:${conversationId}`)) return;

      const conversation = await Conversation.findById(conversationId).select("participants");
      const otherUserIds = (conversation?.participants || [])
        .filter((participant) => String(participant) !== userId)
        .map(String);
      const blockStatuses = await getBlockStatuses(userId, otherUserIds);
      if (otherUserIds.some((otherUserId) => blockStatuses.get(otherUserId)?.isBlocked)) return;

      socket.to(`conversation:${conversationId}`).emit("user_typing", {
        conversationId,
        userId,
      });
    });

    // User stopped typing
    socket.on("stop_typing", async ({ conversationId } = {}) => {
      if (!conversationId || !socket.rooms.has(`conversation:${conversationId}`)) return;

      const conversation = await Conversation.findById(conversationId).select("participants");
      const otherUserIds = (conversation?.participants || [])
        .filter((participant) => String(participant) !== userId)
        .map(String);
      const blockStatuses = await getBlockStatuses(userId, otherUserIds);
      if (otherUserIds.some((otherUserId) => blockStatuses.get(otherUserId)?.isBlocked)) return;

      socket.to(`conversation:${conversationId}`).emit("user_stop_typing", {
        conversationId,
        userId,
      });
    });

    
socket.on("send_message", async (data) => {
  try {
    const {
      conversationId,
      text,
    } = data;

    if (!conversationId || !text?.trim()) {
      return;
    }

    const Message = require("../models/Message");
    const Conversation = require("../models/Conversation");

    // Find conversation
    const conversation =
      await Conversation.findById(conversationId);

    if (!conversation) {
      socket.emit("message_error", {
        message: "Conversation not found",
      });

      return;
    }

    // Check sender is participant
    const isParticipant =
      conversation.participants.some(
        (participant) =>
          String(participant) ===
          String(socket.userId)
      );

    if (!isParticipant) {
      socket.emit("message_error", {
        message:
          "You are not a participant of this conversation",
      });

      return;
    }

    const otherUserIds = conversation.participants
      .filter((participant) => String(participant) !== String(socket.userId))
      .map(String);
    const blockStatuses = await getBlockStatuses(socket.userId, otherUserIds);
    if (otherUserIds.some((otherUserId) => blockStatuses.get(otherUserId)?.isBlocked)) {
      socket.emit("message_error", {
        message: "You cannot message this user while a block is active",
      });
      return;
    }

    // Save message
    const message = await Message.create({
      conversationId,
      sender: socket.userId,
      text: text.trim(),
      messageType: "text",
      status: otherUserIds.some((otherUserId) => connectedUsers.get(otherUserId)?.size)
        ? "delivered"
        : "sent",
    });
    // Invalidate messages cache
    const cacheKey = `messages:${conversationId}`;

    await invalidateCache(cacheKey);

    // Populate sender
    const populatedMessage =
      await Message.findById(message._id).populate(
        "sender",
        "fullName email phoneNumber avatar status lastSeen privacy"
      );

    // Update conversation time
    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessageAt: new Date(),
      }
    );

    // Send message to all participants
    for (const participant of conversation.participants) {
      const participantId = participant.toString();
      const messageForRecipient = populatedMessage.toObject();
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

  } catch (error) {
    console.error(
      "Socket send message error:",
      error
    );

    socket.emit("message_error", {
      message: "Failed to send message",
    });
  }
});

    socket.on("toggle_reaction", async ({ conversationId, messageId, emoji } = {}) => {
      try {
        if (!conversationId || !messageId || !emoji || emoji.length > 16) {
          socket.emit("reaction_error", { message: "Invalid reaction" });
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        const isParticipant = conversation?.participants.some(
          (participant) => String(participant) === userId
        );

        if (!isParticipant) {
          socket.emit("reaction_error", { message: "Conversation not found" });
          return;
        }

        const message = await Message.findById(messageId);
        if (!message || String(message.conversationId) !== String(conversationId)) {
          socket.emit("reaction_error", { message: "Message not found" });
          return;
        }

        message.reactions ||= [];
        let reaction = message.reactions.find((item) => item.emoji === emoji);

        if (reaction) {
          const userIndex = reaction.users.findIndex(
            (reactionUserId) => String(reactionUserId) === userId
          );

          if (userIndex >= 0) {
            reaction.users.splice(userIndex, 1);
            if (reaction.users.length === 0) {
              message.reactions.splice(message.reactions.indexOf(reaction), 1);
            }
          } else {
            reaction.users.push(socket.userId);
          }
        } else {
          message.reactions.push({ emoji, users: [socket.userId] });
        }

        await message.save();
        const cacheKey = `messages:${conversationId}`;

        await invalidateCache(cacheKey);
        conversation.participants.forEach((participant) => {
          const participantId = String(participant);
          io.to(`user:${participantId}`).emit("message_reactions_updated", {
            conversationId: String(conversationId),
            messageId: String(messageId),
            reactions: formatReactions(message.reactions, participantId),
          });
        });
      } catch (error) {
        console.error("Socket reaction error:", error);
        socket.emit("reaction_error", { message: "Unable to update reaction" });
      }
    });
    // CALL SIGNALING
    // CALL USER
    socket.on("call_user", async ({ callId, receiverId, type } = {}) => {
  try {
    if (!callId || !receiverId) {
      socket.emit("call_error", {
        message: "Invalid call request",
      });
      return;
    }

    const callerId = String(userId);
    const targetUserId = String(receiverId);

    if (callerId === targetUserId) {
      socket.emit("call_error", {
        message: "You cannot call yourself",
      });
      return;
    }

    // Check receiver exists
    const receiver = await User.findById(targetUserId)
      .select("_id fullName avatar status")
      .lean();

    if (!receiver) {
      socket.emit("call_unavailable", {
        callId,
        receiverId: targetUserId,
        reason: "user_not_found",
      });
      return;
    }

    // Check block status
    const blockStatuses = await getBlockStatuses(
      callerId,
      [targetUserId]
    );

    const blockStatus = blockStatuses.get(targetUserId);

    if (blockStatus?.isBlocked) {
      socket.emit("call_unavailable", {
        callId,
        receiverId: targetUserId,
        reason: "blocked",
      });
      return;
    }

    // Check whether receiver is online
    const receiverSockets = connectedUsers.get(targetUserId);

    if (!receiverSockets || receiverSockets.size === 0) {
      socket.emit("call_unavailable", {
        callId,
        receiverId: targetUserId,
        reason: "offline",
      });
      return;
    }

    // Get caller information
    const caller = await User.findById(callerId)
      .select("_id fullName avatar status")
      .lean();

    if (!caller) {
      socket.emit("call_error", {
        message: "Caller not found",
      });
      return;
    }

    const callType = type === "video" ? "video" : "voice";

await Call.create({
  callId: String(callId),
  caller: callerId,
  receiver: targetUserId,
  callType,
  status: "ringing",
  startedAt: new Date(),
});

    // Send incoming call to ALL receiver sockets
    io.to(`user:${targetUserId}`).emit("incoming_call", {
      callId,
      callerId,
      caller: {
        _id: String(caller._id),
        fullName: caller.fullName,
        avatar: caller.avatar || null,
        status: caller.status,
      },
     type: callType,
    });

    socket.emit("call_ringing", {
      callId,
      receiverId: targetUserId,
    });

    console.log(
      `Call started: ${callerId} -> ${targetUserId} (${type})`
    );

  } catch (error) {
    console.error("Call user error:", error);

    socket.emit("call_error", {
      message: "Unable to start call",
    });
  }
});


// ------------------------------------------------------------
// ACCEPT CALL
// ------------------------------------------------------------

socket.on("accept_call", async ({ callId, callerId } = {}) => {
  try {
    if (!callId || !callerId) return;

    const accepterId = String(userId);
    const targetCallerId = String(callerId);

    // Verify the call exists and the accepter is the receiver
    const call = await Call.findOne({
      callId: String(callId),
      caller: targetCallerId,
      receiver: accepterId,
      status: "ringing",
    });

    if (!call) {
      socket.emit("call_error", {
        message: "Call not found or no longer available",
      });
      return;
    }

    // Make sure caller is still online
    const callerSockets = connectedUsers.get(targetCallerId);

    if (!callerSockets || callerSockets.size === 0) {
      socket.emit("call_unavailable", {
        callId,
        receiverId: targetCallerId,
        reason: "caller_offline",
      });
      return;
    }

    // Update call history
    call.status = "answered";
    call.answeredAt = new Date();
    await call.save();

    // Notify caller
    io.to(`user:${targetCallerId}`).emit("call_accepted", {
      callId,
      receiverId: accepterId,
    });

    console.log(
      `Call accepted: ${accepterId} -> ${targetCallerId}`
    );

  } catch (error) {
    console.error("Accept call error:", error);

    socket.emit("call_error", {
      message: "Unable to accept call",
    });
  }
});



// ------------------------------------------------------------
// REJECT CALL
// ------------------------------------------------------------

socket.on("reject_call", async ({ callId, callerId } = {}) => {
  try {
    if (!callId || !callerId) return;

    const rejecterId = String(userId);
    const targetCallerId = String(callerId);

    // Verify the call and ensure this user is the receiver
    const call = await Call.findOne({
      callId: String(callId),
      caller: targetCallerId,
      receiver: rejecterId,
      status: "ringing",
    });

    if (!call) {
      socket.emit("call_error", {
        message: "Call not found or no longer available",
      });
      return;
    }

    // Update call history
    call.status = "rejected";
    call.endedAt = new Date();
    call.durationSeconds = 0;

    await call.save();

    // Notify caller
    io.to(`user:${targetCallerId}`).emit("call_rejected", {
      callId,
      receiverId: rejecterId,
    });

    console.log(
      `Call rejected: ${rejecterId} -> ${targetCallerId}`
    );

  } catch (error) {
    console.error("Reject call error:", error);

    socket.emit("call_error", {
      message: "Unable to reject call",
    });
  }
});

// ------------------------------------------------------------
// CANCEL OUTGOING CALL
// ------------------------------------------------------------

socket.on("cancel_call", async ({ callId } = {}) => {
  try {
    if (!callId) return;

    const cancellingUserId = String(userId);
    const call = await Call.findOne({
      callId: String(callId),
      caller: cancellingUserId,
      status: "ringing",
    });

    if (!call) {
      socket.emit("call_error", {
        message: "Call not found or no longer available",
      });
      return;
    }

    call.status = "cancelled";
    call.endedAt = new Date();
    call.durationSeconds = 0;
    call.endedBy = cancellingUserId;
    await call.save();

    io.to(`user:${call.receiver}`).emit("call_cancelled", {
      callId: String(callId),
      callerId: cancellingUserId,
    });
  } catch (error) {
    console.error("Cancel call error:", error);
    socket.emit("call_error", {
      message: "Unable to cancel call",
    });
  }
});



// ------------------------------------------------------------
// END CALL
// ------------------------------------------------------------

socket.on("end_call", async ({ callId, receiverId } = {}) => {
  console.log("🔥 END_CALL RECEIVED:", {
    socketUser: userId,
    callId,
    receiverId,
  });

  try {
    if (!callId || !receiverId) return;

    const endingUserId = String(userId);
    const targetUserId = String(receiverId);

    // Verify that the caller and receiver belong to this call
    const call = await Call.findOne({
      callId: String(callId),
      $or: [
        {
          caller: endingUserId,
          receiver: targetUserId,
        },
        {
          caller: targetUserId,
          receiver: endingUserId,
        },
      ],
      status: "answered",
    });

    if (!call) {
      socket.emit("call_error", {
        message: "Active call not found",
      });
      return;
    }

    // Calculate call duration
    const endedAt = new Date();
    const answeredAt = call.answeredAt || endedAt;

    call.endedAt = endedAt;
    call.durationSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - answeredAt.getTime()) / 1000)
    );
    call.status = "completed";
    call.endedBy = endingUserId;

    await call.save();

    // Notify the other user
    io.to(`user:${targetUserId}`).emit("call_ended", {
      callId,
      userId: endingUserId,
    });

    console.log(
      `Call ended: ${endingUserId} -> ${targetUserId}, duration: ${call.durationSeconds}s`
    );
  } catch (error) {
    console.error("End call error:", error);
    socket.emit("call_error", {
      message: "Unable to end call",
    });
  }
});


// ANSWER
socket.on("webrtc_answer", ({ callId, callerId, answer } = {}) => {
  if (!callId || !callerId || !answer) return;

  io.to(`user:${String(callerId)}`).emit("webrtc_answer", {
    callId,
    receiverId: String(userId),
    answer,
  });
});
    socket.on("disconnect", async (reason) => {
      console.log(
        "Socket disconnected:",
        socket.id,
        reason
      );

      const userSockets = connectedUsers.get(userId);

      if (!userSockets) {
        return;
      }

      // Remove this socket
      userSockets.delete(socket.id);

      // --------------------------------
      // Still another tab/device connected
      // --------------------------------

      if (userSockets.size > 0) {
        console.log(
          `User ${userId} still connected through ${userSockets.size} socket(s)`
        );

        return;
      }

      // --------------------------------
      // No sockets left → OFFLINE
      // --------------------------------

      connectedUsers.delete(userId);

      const lastSeen = new Date();

      try {
        await User.findByIdAndUpdate(userId, {
          status: "offline",
          lastSeen,
        });

        console.log(`User ${userId} is OFFLINE`);
      } catch (error) {
        console.error(
          "Offline status update error:",
          error
        );
      }

      // Notify other clients
      await emitVisibleUserStatus(userId, {
        userId,
        status: "offline",
        lastSeen,
      });
    });
  });

  return io;
};



module.exports = setupSocket;