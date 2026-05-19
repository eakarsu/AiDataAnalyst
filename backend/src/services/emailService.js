import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT) || 587,
    secure: parseInt(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  return transporter;
}

const FROM_ADDRESS = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@aidataanalyst.com';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[EMAIL] SMTP not configured — skipping send to ${to}. Subject: ${subject}`);
    return { skipped: true };
  }

  try {
    const info = await t.sendMail({ from: FROM_ADDRESS, to, subject, html, text });
    console.log(`[EMAIL] Sent to ${to}: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL] Failed to send to ${to}:`, err.message);
    return { error: err.message };
  }
}

export async function sendVerificationEmail(email, token) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Verify your AI Data Analyst account',
    text: `Please verify your email by visiting: ${verifyUrl}`,
    html: `
      <h2>Welcome to AI Data Analyst</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verifyUrl}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Verify Email</a></p>
      <p>Or copy this link: ${verifyUrl}</p>
      <p>This link expires in 24 hours.</p>
    `
  });
}

export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Reset your AI Data Analyst password',
    text: `Reset your password by visiting: ${resetUrl}`,
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
      <p>Or copy this link: ${resetUrl}</p>
      <p>This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
    `
  });
}

export default { sendVerificationEmail, sendPasswordResetEmail };
