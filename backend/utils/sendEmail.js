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
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LinkChat Password Reset</title>
</head>

<body style="margin:0; padding:0; background-color:#09090b; font-family:Arial, Helvetica, sans-serif;">

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

        <table
          width="520"
          cellpadding="0"
          cellspacing="0"
          border="0"
          bgcolor="#111318"
          style="width:520px; max-width:520px; background-color:#111318;"
        >
          <tr>
            <td
              height="4"
              bgcolor="#22d3ee"
              style="height:4px; line-height:4px; font-size:0; background-color:#22d3ee;"
            >&nbsp;</td>
          </tr>

          <tr>
            <td
              align="center"
              bgcolor="#111827"
              style="padding:32px 25px; background-color:#111827;"
            >
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td
                    width="54"
                    height="54"
                    align="center"
                    valign="middle"
                    bgcolor="#22d3ee"
                    style="width:54px; height:54px; background-color:#22d3ee; color:#061018; font-family:Arial, Helvetica, sans-serif; font-size:26px; font-weight:bold;"
                  >L</td>
                </tr>
              </table>

              <div style="height:14px; line-height:14px; font-size:14px;">&nbsp;</div>

              <div style="color:#ffffff; font-size:24px; line-height:30px; font-weight:bold;">
                LinkChat
              </div>

              <div style="color:#94a3b8; font-size:13px; line-height:20px; padding-top:6px;">
                Password Recovery
              </div>
            </td>
          </tr>

          <tr>
            <td
              bgcolor="#111318"
              style="padding:35px 30px; background-color:#111318;"
            >
              <div style="color:#ffffff; font-size:21px; line-height:28px; font-weight:bold;">
                Reset your password
              </div>

              <div style="height:10px; line-height:10px; font-size:10px;">&nbsp;</div>

              <div style="color:#94a3b8; font-size:14px; line-height:22px;">
                We received a request to reset your LinkChat password.
                Use the verification code below to continue.
              </div>

              <div style="height:25px; line-height:25px; font-size:25px;">&nbsp;</div>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td
                    align="center"
                    bgcolor="#0b1118"
                    style="padding:25px 15px; background-color:#0b1118; border:1px solid #164e63;"
                  >
                    <div style="color:#67e8f9; font-size:11px; line-height:18px; font-weight:bold; letter-spacing:2px;">
                      VERIFICATION CODE
                    </div>

                    <div style="height:10px; line-height:10px; font-size:10px;">&nbsp;</div>

                    <div style="color:#22d3ee; font-size:34px; line-height:42px; font-weight:bold; letter-spacing:7px;">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>

              <div style="height:20px; line-height:20px; font-size:20px;">&nbsp;</div>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td
                    bgcolor="#17202b"
                    style="padding:13px 15px; background-color:#17202b; border-left:3px solid #22d3ee;"
                  >
                    <div style="color:#cbd5e1; font-size:12px; line-height:19px;">
                      This verification code will expire in
                      <strong style="color:#ffffff;">10 minutes</strong>.
                    </div>
                  </td>
                </tr>
              </table>

              <div style="height:22px; line-height:22px; font-size:22px;">&nbsp;</div>

              <div style="color:#64748b; font-size:12px; line-height:20px;">
                If you didn't request a password reset, you can safely
                ignore this email. Your password will remain unchanged.
              </div>
            </td>
          </tr>

          <tr>
            <td
              align="center"
              bgcolor="#0d1015"
              style="padding:22px 25px; background-color:#0d1015; border-top:1px solid #272b35;"
            >
              <div style="color:#64748b; font-size:11px; line-height:18px;">
                This is an automated message from
                <strong style="color:#22d3ee;">LinkChat</strong>.
              </div>

              <div style="height:5px; line-height:5px; font-size:5px;">&nbsp;</div>

              <div style="color:#475569; font-size:10px; line-height:16px;">
                Please do not reply to this email.
              </div>
            </td>
          </tr>
        </table>

        <div style="height:20px; line-height:20px; font-size:20px;">&nbsp;</div>

        <div style="color:#475569; font-size:10px; line-height:16px;">
          © ${new Date().getFullYear()} LinkChat
        </div>
      </td>
    </tr>
  </table>

</body>
</html>
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