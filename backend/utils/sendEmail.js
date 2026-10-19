const { Resend } = require("resend");

const sendResetEmail = async (email, otp) => {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw new Error("RESEND_API_KEY and RESEND_FROM_EMAIL must be configured");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject: "LinkChat Password Reset OTP",
    text: `Your LinkChat password reset OTP is ${otp}. This OTP will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>LinkChat password reset</h2>
        <p>You requested to reset your password. Use this verification code to continue:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 15px; background: #f3f4f6; text-align: center;">
          ${otp}
        </div>
        <p>This OTP expires in 10 minutes.</p>
        <p>If you did not request this, please ignore this email. Your password will remain unchanged.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend email error:", error);
    throw new Error("Failed to send password reset email");
  }

  console.log("Password reset email accepted by Resend:", data.id);

  return data;
};

module.exports = sendResetEmail;