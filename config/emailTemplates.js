/**
 * Email Templates for ElectroHub
 * Purpose: Generate branded HTML email bodies for transactional emails.
 * Usage: const { passwordResetEmail } = require('./emailTemplates');
 */

/**
 * Password reset email template
 * @param {string} userName  - The recipient's display name
 * @param {string} resetLink - The full URL to the reset-password page
 * @returns {string} - Full HTML string for the email body
 */
function passwordResetEmail(userName, resetLink) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password — ElectroHub</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f6;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Outer Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f6;padding:48px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.07);">

          <!-- Header: Styled Text Logo (Guaranteed to show in all clients) -->
          <tr>
            <td style="background:#111111;padding:40px 48px;text-align:center;">
              <div style="display:inline-block;">
                <span style="font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-1px;">Electro</span><span style="font-size:32px;font-weight:800;color:#007aff;letter-spacing:-1px;">Hub</span>
              </div>
              <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:4px 0 0 0;letter-spacing:2px;text-transform:uppercase;">Premium Electronics</p>
            </td>
          </tr>

          <!-- Blue accent line -->
          <tr>
            <td style="padding:0;line-height:0;">
              <div style="height:4px;background:#007aff;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 48px 36px 48px;">

              <!-- Headline -->
              <h1 style="margin:0 0 12px 0;font-size:26px;font-weight:800;color:#111111;text-align:center;letter-spacing:-0.5px;">Reset Your Password</h1>
              <p style="margin:0 0 32px 0;font-size:15px;color:#6e7681;text-align:center;line-height:1.6;">We received a request to reset the password for your account.</p>

              <!-- Divider -->
              <div style="height:1px;background:#e2e8f0;margin-bottom:32px;"></div>

              <!-- Greeting -->
              <p style="margin:0 0 16px 0;font-size:16px;color:#333333;line-height:1.6;">Hi <strong style="color:#111111;">${userName}</strong>,</p>
              <p style="margin:0 0 32px 0;font-size:16px;color:#333333;line-height:1.7;">
                Someone requested a password reset for your <strong style="color:#111111;">ElectroHub</strong> account. Click the button below to choose a new password. This link is valid for <strong style="color:#111111;">1 hour</strong>.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}"
                       style="display:inline-block;background:#007aff;color:#ffffff;font-size:17px;font-weight:700;padding:18px 48px;border-radius:12px;text-decoration:none;letter-spacing:0.2px;box-shadow:0 6px 20px rgba(0,122,255,0.25);">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link box -->
              <div style="background:#f4f5f6;border-radius:12px;padding:20px;margin-bottom:32px;border:1px solid #e2e8f0;">
                <p style="margin:0 0 8px 0;font-size:11px;color:#adb5bd;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Trouble with the button? Copy this link:</p>
                <p style="margin:0;font-size:13px;color:#007aff;word-break:break-all;line-height:1.5;">${resetLink}</p>
              </div>

              <!-- Security notice -->
              <div style="background:#fffbeb;border-radius:12px;padding:20px;border-left:4px solid #f59e0b;">
                <p style="margin:0;font-size:14px;color:#92400e;line-height:1.65;">
                  <strong>⚠️ Security Note:</strong> If you didn't request this reset, please ignore this email. Your account is safe.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f5f6;padding:32px 48px;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#adb5bd;text-align:center;">
                <strong style="color:#6e7681;">ElectroHub</strong> &middot; Nabatiye, Lebanon
              </p>
              <p style="margin:0;font-size:12px;color:#adb5bd;text-align:center;">
                &copy; ${new Date().getFullYear()} ElectroHub. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Card -->

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

module.exports = { passwordResetEmail };
