const User = require("../models/User");
const Conversation = require("../models/Conversation");
const { DEFAULT_PRIVACY, getPrivacy } = require("../utils/privacy");
const { sanitizeUserForViewer } = require("../utils/privacy");

const PRIVACY_VISIBILITY_OPTIONS = ["everyone", "contacts", "nobody"];

exports.getPrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("privacy").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ privacy: getPrivacy(user) });
  } catch (error) {
    console.error("Get privacy settings error:", error);
    return res.status(500).json({ message: "Failed to load privacy settings" });
  }
};

exports.updatePrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("privacy");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const nextPrivacy = { ...getPrivacy(user), ...(req.body || {}) };
    if (
      !PRIVACY_VISIBILITY_OPTIONS.includes(nextPrivacy.lastSeen) ||
      !PRIVACY_VISIBILITY_OPTIONS.includes(nextPrivacy.photoVisibility) ||
      typeof nextPrivacy.onlineStatus !== "boolean" ||
      typeof nextPrivacy.readReceipts !== "boolean" ||
      Object.keys(req.body || {}).some((key) => !Object.hasOwn(DEFAULT_PRIVACY, key))
    ) {
      return res.status(400).json({ message: "Invalid privacy settings" });
    }

    user.privacy = nextPrivacy;
    await user.save();

    return res.json({ privacy: getPrivacy(user) });
  } catch (error) {
    console.error("Update privacy settings error:", error);
    return res.status(500).json({ message: "Failed to save privacy settings" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const fullName = typeof req.body.fullName === "string"
      ? req.body.fullName.trim()
      : "";
    const email = typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
    const phoneNumber = typeof req.body.phoneNumber === "string"
      ? req.body.phoneNumber.trim()
      : "";

    if (
      fullName.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^\d{7,15}$/.test(phoneNumber.replace(/\D/g, ""))
    ) {
      return res.status(400).json({ message: "Invalid profile details" });
    }

    const [existingEmail, existingPhone] = await Promise.all([
      User.findOne({ email, _id: { $ne: req.userId } }).select("_id").lean(),
      User.findOne({ phoneNumber, _id: { $ne: req.userId } }).select("_id").lean(),
    ]);

    if (existingEmail) {
      return res.status(409).json({ message: "Email is already in use" });
    }
    if (existingPhone) {
      return res.status(409).json({ message: "Phone number is already in use" });
    }

    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.fullName = fullName;
    user.email = email;
    user.phoneNumber = phoneNumber;
    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        status: user.status,
        lastSeen: user.lastSeen,
        privacy: getPrivacy(user),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email is already in use" });
    }

    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

exports.searchUserByPhone = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone || phone.trim().length < 3) {
      return res.status(200).json({
        users: [],
      });
    }

    const phonePattern = phone.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const currentUser = await User.findById(req.userId)
      .select("blockedUsers")
      .lean();
    const excludedIds = [
      req.userId,
      ...(currentUser?.blockedUsers || []),
    ];

    const users = await User.find({
      phoneNumber: { $regex: phonePattern },
      status: { $ne: "deactivated" },
      _id: {
        $nin: excludedIds,
      },
      blockedUsers: { $ne: req.userId },
    })
      .select("fullName phoneNumber avatar status lastSeen privacy")
      .limit(10);

    const conversations = await Conversation.find({ participants: req.userId })
      .select("participants")
      .lean();
    const contactIds = new Set(
      conversations.flatMap((conversation) =>
        conversation.participants.map(String)
      )
    );

    return res.status(200).json({
      users: users.map((user) =>
        sanitizeUserForViewer(user, req.userId, contactIds.has(String(user._id)))
      ),
    });
  } catch (error) {
    console.error("User search error:", error);

    return res.status(500).json({
      message: "User search failed",
    });
  }
};