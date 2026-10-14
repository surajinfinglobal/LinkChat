const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getCallHistory } = require("../controllers/callController");

const router = express.Router();

router.get("/", protect, getCallHistory);

module.exports = router;
