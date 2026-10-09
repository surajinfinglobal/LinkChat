const express = require("express");

const {
  getConversations,
  createOrGetConversation,
} = require("../controllers/conversationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  getConversations
);

router.post(
  "/",
  protect,
  createOrGetConversation
);

module.exports = router;