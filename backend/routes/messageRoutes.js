
const express = require("express");
const multer = require("multer");
const protect = require("../middleware/authMiddleware");
const uploadMessageImages = require("../middleware/uploadMessageImages");
const {
  getMessages,
  sendMessage,
} = require("../controllers/messageController");
const router = express.Router();

router.get("/:conversationId", protect, getMessages);


router.post(
  "/",
  protect,
  uploadMessageImages.array("images", 10),
  sendMessage
);

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      message: error.code === "LIMIT_FILE_SIZE"
        ? "Each image must be less than 5 MB"
        : "You can send up to 10 images at a time",
    });
  }

  if (error.message === "Only JPG, PNG and WEBP images are allowed") {
    return res.status(400).json({ message: error.message });
  }

  return next(error);
});

module.exports = router;