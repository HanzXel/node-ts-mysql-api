import nodemailer from 'nodemailer';

// Use environment variables in production, fallback to config.json locally
let config: any;
try {
  config = require('../config.json');
} catch {
  config = {};
}

const emailFrom   = process.env.EMAIL_FROM   || config.emailFrom   || 'noreply@example.com';
const smtpHost    = process.env.SMTP_HOST    || config.smtpOptions?.host;
const smtpPort    = parseInt(process.env.SMTP_PORT || String(config.smtpOptions?.port || 587));
const smtpUser    = process.env.SMTP_USER    || config.smtpOptions?.auth?.user;
const smtpPass    = process.env.SMTP_PASS    || config.smtpOptions?.auth?.pass;

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  await transporter.sendMail({ from: emailFrom, to, subject, html });
}
