const express = require("express");
const router = express.Router();
const { getActiveSessions, revokeSession } = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const User = require("../models/User");

const {
  getPrivacySettings,
  updatePrivacySettings,
  updateProfile,
  searchUserByPhone,
} = require("../controllers/userController");

router.get("/sessions", protect, getActiveSessions);
router.delete("/sessions/:sessionId", protect, revokeSession);
router.get("/privacy", protect, getPrivacySettings);
router.put("/privacy", protect, updatePrivacySettings);
router.put("/profile", protect, updateProfile);
router.get(
  "/search",
  protect,
  searchUserByPhone
);
router.put(
  "/avatar",
  protect,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Avatar image is required"
        });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        req.userId,
        {
          avatar: avatarUrl
        },
        {
          new: true
        }
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      res.status(200).json({
        message: "Avatar updated successfully",
        user
      });

    } catch (error) {
      console.error("Avatar upload error:", error);

      res.status(500).json({
        message: "Avatar upload failed"
      });
    }
  }
);



router.get("/profile", protect, async (req, res) => {
  res.json({
    message: "Protected profile route",
    userId: req.userId
  });
});

module.exports = router;