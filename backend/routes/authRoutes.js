const express = require("express");

const {
  signup,
  login,
  me,
  deactivateAccount,
  reactivateAccount,
  changePassword,
   forgotPassword,
   verifyResetOtp,
  resetPassword
} = require("../controllers/authController");

const authMiddleware = require('../middleware/authMiddleware'); 

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get('/me', authMiddleware, me) 

router.put("/deactivate-account", authMiddleware, deactivateAccount);
router.put("/reactivate-account", authMiddleware, reactivateAccount);
// Change password
router.put("/change-password", authMiddleware, changePassword);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

module.exports = router;