// Lazily require nodemailer so the app doesn't crash if it's not installed
// yet (e.g. right after pulling this update, before `npm install`).
let nodemailer = null;
try {
  nodemailer = require("nodemailer");
} catch {
  nodemailer = null;
}

const isConfigured = () =>
  !!(nodemailer && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
const getTransporter = () => {
  if (!isConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

// ─── Password reset email ─────────────────────────────────────────────────────
const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  const t = getTransporter();

  // Dev fallback: no SMTP configured — log the link so local development
  // still works without setting up a real mail server.
  // In production this is a security risk (the reset link would leak into
  // server logs), so we only print the link outside production; in prod we
  // just warn loudly that SMTP is missing.
  if (!t) {
    if (process.env.NODE_ENV === "production") {
      console.error(`[mailer] SMTP is not configured — password reset email to ${toEmail} was NOT sent.`);
    } else {
      console.log(`\n[mailer] SMTP is not configured — password reset link for ${toEmail}:`);
      console.log(`[mailer] ${resetUrl}\n`);
    }
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await t.sendMail({
      from,
      to: toEmail,
      subject: "Reset your password",
      text: `We received a request to reset your password. Open this link to choose a new one (valid for 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
          <h2 style="margin-bottom: 8px;">Reset your password</h2>
          <p>We received a request to reset your password. This link is valid for 1 hour.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background:#3ddc84;color:#0c3b2b;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700;display:inline-block;">
              Reset password
            </a>
          </p>
          <p style="font-size: 13px; color: #666;">If the button doesn't work, copy and paste this link into your browser:<br>${resetUrl}</p>
          <p style="font-size: 13px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    // Never let a mail-delivery failure surface the user's email existence
    // (or lack thereof) to the caller — just log it server-side.
    console.error("[mailer] Failed to send password reset email:", err.message);
  }
};

// ─── Email verification code ──────────────────────────────────────────────────
const sendVerificationCodeEmail = async (toEmail, code) => {
  const t = getTransporter();

  if (!t) {
    if (process.env.NODE_ENV === "production") {
      console.error(`[mailer] SMTP is not configured — verification code email to ${toEmail} was NOT sent.`);
    } else {
      console.log(`\n[mailer] SMTP is not configured — verification code for ${toEmail}:`);
      console.log(`[mailer] ${code}\n`);
    }
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await t.sendMail({
      from,
      to: toEmail,
      subject: "Your verification code",
      text: `Your verification code is ${code}. It expires in 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
          <h2 style="margin-bottom: 8px;">Your verification code</h2>
          <p>Enter this code to confirm it's really you. It expires in 10 minutes.</p>
          <p style="margin: 24px 0; font-size: 32px; font-weight: 700; letter-spacing: 6px; text-align: center; background:#f4f4f4; padding: 16px; border-radius: 8px;">
            ${code}
          </p>
          <p style="font-size: 13px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[mailer] Failed to send verification code email:", err.message);
  }
};

module.exports = { sendPasswordResetEmail, sendVerificationCodeEmail, isConfigured };
