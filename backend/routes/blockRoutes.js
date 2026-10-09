const express = require("express");

const {
  blockUser,
  unblockUser,
  getBlockedUsers,
} = require("../controllers/blockController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getBlockedUsers);

router.post("/:userId", protect, blockUser);

router.delete("/:userId", protect, unblockUser);

module.exports = router;