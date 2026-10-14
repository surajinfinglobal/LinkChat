const User = require("../models/User");
const Session = require("../models/Session");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getPrivacy } = require("../utils/privacy");

const PasswordReset = require("../models/PasswordReset");
const crypto = require("crypto");
const nodemailer = require("nodemailer");



const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
// create tocken 
const createToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d" 
    }
  );
};




exports.signup = async (req, res) => {
  try {

     const { fullName, email, phoneNumber, password } = req.body;

     // Check fields
        if (!fullName || !email || !phoneNumber || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

   
    // Check existing email
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

    // Check existing number
    const existingNumber = await User.findOne({ phoneNumber });

    if (existingNumber) {
      return res.status(409).json({
        message: "Number already registered"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
        const user = await User.create({
            fullName,
            email,
            phoneNumber,
            password: hashedPassword,
            avatar: "/uploads/avatars/default1.jpg"
        });

    // Create JWT
    const token = createToken(user._id);

    res.status(201).json({
      message: "Registration successful",

      token,

      user: {
        id: user._id,
       fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        status: user.status,
        privacy: getPrivacy(user),
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};


// for log in 

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.status === "deactivated") {
      return res.status(403).json({
        message: "Account is deactivated",
      });
    }

    // Identify the browser and operating system.
    const userAgent = req.headers["user-agent"] || "";
    const ua = userAgent.toLowerCase();

    let browser = "Unknown browser";

    if (ua.includes("edg/")) browser = "Microsoft Edge";
    else if (ua.includes("opr/")) browser = "Opera";
    else if (ua.includes("firefox/")) browser = "Firefox";
    else if (ua.includes("chrome/")) browser = "Chrome";
    else if (ua.includes("safari/")) browser = "Safari";

    let os = "Unknown OS";

    if (ua.includes("android")) os = "Android";
    else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
    else if (ua.includes("windows")) os = "Windows";
    else if (ua.includes("ubuntu")) os = "Ubuntu";
    else if (ua.includes("linux")) os = "Linux";
    else if (ua.includes("mac os") || ua.includes("macintosh")) os = "macOS";

    const device = /mobile|android|iphone|ipad/i.test(userAgent)
      ? "Mobile device"
      : /tablet/i.test(userAgent)
        ? "Tablet"
        : "Desktop";

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    const forwardedFor = req.headers["x-forwarded-for"];
    let clientIp = Array.isArray(forwardedFor)
  ? forwardedFor[0]
  : forwardedFor?.split(",")[0]?.trim() || req.ip || req.socket.remoteAddress || "";

if (clientIp.startsWith("::ffff:")) {
  clientIp = clientIp.substring(7);
}

if (clientIp === "::1") {
  clientIp = "127.0.0.1";
}
    // Create a database session for this login.
    const session = await Session.create({
      userId: user._id,
      device,
      browser,
      os,
      ipAddress: clientIp,
      userAgent,
      loginAt: now,
      lastActiveAt: now,
      expiresAt,
    });

    // Include sessionId in the JWT.
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        sessionId: session._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
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
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed",
    });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Security: account exist karta hai ya nahi reveal nahi karna
    if (!user) {
      return res.status(200).json({
        message: "If an account exists, a reset OTP has been sent",
      });
    }

    // Old OTP delete
    await PasswordReset.deleteMany({
      userId: user._id,
    });

    // 6 digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // OTP hash
    const otpHash = await bcrypt.hash(otp, 10);

    // 10 minutes expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PasswordReset.create({
      userId: user._id,
      email: normalizedEmail,
      otpHash,
      expiresAt,
    });

    await transporter.sendMail({
      from: `"LinkChat" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "LinkChat Password Reset OTP",
      text: `Your LinkChat password reset OTP is ${otp}. This OTP will expire in 10 minutes.`,
html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LinkChat Password Reset</title>
</head>

<body style="margin:0; padding:0; background-color:#09090b; font-family:Arial, Helvetica, sans-serif;">

  <!-- Main Wrapper -->
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    bgcolor="#09090b"
    style="width:100%; margin:0; padding:0; background-color:#09090b;"
  >
    <tr>
      <td align="center" style="padding:40px 15px;">

        <!-- Email Container -->
        <table
          width="520"
          cellpadding="0"
          cellspacing="0"
          border="0"
          bgcolor="#111318"
          style="
            width:520px;
            max-width:520px;
            background-color:#111318;
          "
        >

          <!-- TOP ACCENT -->
          <tr>
            <td
              height="4"
              bgcolor="#22d3ee"
              style="
                height:4px;
                line-height:4px;
                font-size:0;
                background-color:#22d3ee;
              "
            >
              &nbsp;
            </td>
          </tr>

          <!-- HEADER -->
          <tr>
            <td
              align="center"
              bgcolor="#111827"
              style="
                padding:32px 25px;
                background-color:#111827;
              "
            >

              <!-- Logo -->
              <table
                cellpadding="0"
                cellspacing="0"
                border="0"
                align="center"
              >
                <tr>
                  <td
                    width="54"
                    height="54"
                    align="center"
                    valign="middle"
                    bgcolor="#22d3ee"
                    style="
                      width:54px;
                      height:54px;
                      background-color:#22d3ee;
                      color:#061018;
                      font-family:Arial, Helvetica, sans-serif;
                      font-size:26px;
                      font-weight:bold;
                    "
                  >
                    L
                  </td>
                </tr>
              </table>

              <div
                style="
                  height:14px;
                  line-height:14px;
                  font-size:14px;
                "
              >
                &nbsp;
              </div>

              <!-- Brand -->
              <div
                style="
                  color:#ffffff;
                  font-size:24px;
                  line-height:30px;
                  font-weight:bold;
                "
              >
                LinkChat
              </div>

              <div
                style="
                  color:#94a3b8;
                  font-size:13px;
                  line-height:20px;
                  padding-top:6px;
                "
              >
                Password Recovery
              </div>

            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td
              bgcolor="#111318"
              style="
                padding:35px 30px;
                background-color:#111318;
              "
            >

              <!-- Heading -->
              <div
                style="
                  color:#ffffff;
                  font-size:21px;
                  line-height:28px;
                  font-weight:bold;
                "
              >
                Reset your password
              </div>

              <div
                style="
                  height:10px;
                  line-height:10px;
                  font-size:10px;
                "
              >
                &nbsp;
              </div>

              <!-- Description -->
              <div
                style="
                  color:#94a3b8;
                  font-size:14px;
                  line-height:22px;
                "
              >
                We received a request to reset your LinkChat password.
                Use the verification code below to continue.
              </div>

              <div
                style="
                  height:25px;
                  line-height:25px;
                  font-size:25px;
                "
              >
                &nbsp;
              </div>

              <!-- OTP TABLE -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                <tr>
                  <td
                    align="center"
                    bgcolor="#0b1118"
                    style="
                      padding:25px 15px;
                      background-color:#0b1118;
                      border:1px solid #164e63;
                    "
                  >

                    <div
                      style="
                        color:#67e8f9;
                        font-size:11px;
                        line-height:18px;
                        font-weight:bold;
                        letter-spacing:2px;
                      "
                    >
                      VERIFICATION CODE
                    </div>

                    <div
                      style="
                        height:10px;
                        line-height:10px;
                        font-size:10px;
                      "
                    >
                      &nbsp;
                    </div>

                    <div
                      style="
                        color:#22d3ee;
                        font-size:34px;
                        line-height:42px;
                        font-weight:bold;
                        letter-spacing:7px;
                      "
                    >
                      ${otp}
                    </div>

                  </td>
                </tr>
              </table>

              <div
                style="
                  height:20px;
                  line-height:20px;
                  font-size:20px;
                "
              >
                &nbsp;
              </div>

              <!-- EXPIRY NOTICE -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                <tr>
                  <td
                    bgcolor="#17202b"
                    style="
                      padding:13px 15px;
                      background-color:#17202b;
                      border-left:3px solid #22d3ee;
                    "
                  >

                    <div
                      style="
                        color:#cbd5e1;
                        font-size:12px;
                        line-height:19px;
                      "
                    >
                      This verification code will expire in
                      <strong style="color:#ffffff;">
                        10 minutes
                      </strong>.
                    </div>

                  </td>
                </tr>
              </table>

              <div
                style="
                  height:22px;
                  line-height:22px;
                  font-size:22px;
                "
              >
                &nbsp;
              </div>

              <!-- SECURITY MESSAGE -->
              <div
                style="
                  color:#64748b;
                  font-size:12px;
                  line-height:20px;
                "
              >
                If you didn't request a password reset, you can safely
                ignore this email. Your password will remain unchanged.
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td
              align="center"
              bgcolor="#0d1015"
              style="
                padding:22px 25px;
                background-color:#0d1015;
                border-top:1px solid #272b35;
              "
            >

              <div
                style="
                  color:#64748b;
                  font-size:11px;
                  line-height:18px;
                "
              >
                This is an automated message from
                <strong style="color:#22d3ee;">
                  LinkChat
                </strong>.
              </div>

              <div
                style="
                  height:5px;
                  line-height:5px;
                  font-size:5px;
                "
              >
                &nbsp;
              </div>

              <div
                style="
                  color:#475569;
                  font-size:10px;
                  line-height:16px;
                "
              >
                Please do not reply to this email.
              </div>

            </td>
          </tr>

        </table>

        <!-- Bottom spacing -->
        <div
          style="
            height:20px;
            line-height:20px;
            font-size:20px;
          "
        >
          &nbsp;
        </div>

        <div
          style="
            color:#475569;
            font-size:10px;
            line-height:16px;
          "
        >
          © ${new Date().getFullYear()} LinkChat
        </div>

      </td>
    </tr>
  </table>

</body>
</html>
`

    });

    return res.status(200).json({
      message: "If an account exists, a reset OTP has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Failed to process password reset",
    });
  }
};


exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    // Find logged-in user
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check current password
    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    // Prevent same password
    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      message: "Failed to change password",
    });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const resetRequest = await PasswordReset.findOne({
      email: normalizedEmail,
      verifiedAt: null,
    }).sort({ createdAt: -1 });

    if (!resetRequest) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    if (resetRequest.expiresAt < new Date()) {
      await PasswordReset.deleteOne({ _id: resetRequest._id });

      return res.status(400).json({
        message: "OTP has expired. Please request a new OTP",
      });
    }

    if (resetRequest.attempts >= 5) {
      return res.status(429).json({
        message: "Too many attempts. Please request a new OTP",
      });
    }

    const isOtpValid = await bcrypt.compare(
      otp.toString(),
      resetRequest.otpHash
    );

    if (!isOtpValid) {
      resetRequest.attempts += 1;
      await resetRequest.save();

      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    resetRequest.verifiedAt = new Date();
    await resetRequest.save();

    return res.status(200).json({
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify reset OTP error:", error);

    return res.status(500).json({
      message: "Failed to verify OTP",
    });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const resetRequest = await PasswordReset.findOne({
      email: normalizedEmail,
    }).sort({ createdAt: -1 });

    if (!resetRequest) {
      return res.status(400).json({
        message: "Invalid or expired reset request",
      });
    }

    if (resetRequest.expiresAt < new Date()) {
      await PasswordReset.deleteOne({ _id: resetRequest._id });

      return res.status(400).json({
        message: "OTP has expired. Please request a new OTP",
      });
    }

    if (!resetRequest.verifiedAt) {
      return res.status(400).json({
        message: "Please verify OTP first",
      });
    }

    const isOtpValid = await bcrypt.compare(
      otp.toString(),
      resetRequest.otpHash
    );

    if (!isOtpValid) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    await PasswordReset.deleteMany({
      userId: user._id,
    });

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Failed to reset password",
    });
  }
};

exports.deactivateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.status === "deactivated") {
      return res.status(400).json({
        message: "Account is already deactivated",
      });
    }

    user.status = "deactivated";
    user.lastSeen = new Date();

    await user.save();

    return res.status(200).json({
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate account error:", error);

    return res.status(500).json({
      message: "Failed to deactivate account",
    });
  }
};

exports.deactivateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.status === "deactivated") {
      return res.status(400).json({
        message: "Account is already deactivated",
      });
    }

    user.status = "deactivated";
    user.lastSeen = new Date();

    await user.save();

    return res.status(200).json({
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate account error:", error);

    return res.status(500).json({
      message: "Failed to deactivate account",
    });
  }
};


exports.reactivateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.status !== "deactivated") {
      return res.status(400).json({
        message: "Account is already active",
      });
    }

    user.status = "offline";
    await user.save();

    return res.status(200).json({
      message: "Account activated successfully",
    });
  } catch (error) {
    console.error("Reactivate account error:", error);

    return res.status(500).json({
      message: "Failed to activate account",
    });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}