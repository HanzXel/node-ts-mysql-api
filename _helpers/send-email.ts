import nodemailer from 'nodemailer';
const config = require('../config.json');

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const transporter = nodemailer.createTransport(config.smtpOptions);
  await transporter.sendMail({
    from: config.emailFrom,
    to,
    subject,
    html
  });
}