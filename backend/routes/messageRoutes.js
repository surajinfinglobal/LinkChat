const express = require("express");

const {
  getMessages,
  sendMessage,
} = require("../controllers/messageController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/:conversationId",
  protect,
  getMessages
);

router.post(
  "/",
  protect,
  sendMessage
);

module.exports = router;