import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const smtp_host = process.env.SMTP_HOST || "smtp.gmail.com";
const smtp_user = process.env.SMTP_USER;
const smtp_pass = process.env.SMTP_PASS;
const smtp_from = process.env.SMTP_FROM || smtp_user;
const smtp_from_name = process.env.SMTP_FROM_NAME || "My App";
const smtp_port = Number(process.env.SMTP_PORT) || 465; // default secure port
const smtp_secure = smtp_port === 465; // true for 465, false for others

if (!smtp_user || !smtp_pass) {
  throw new Error("SMTP credentials are missing in environment variables");
}

// Simplified transporter for production-safe email sending
const transporter = nodemailer.createTransport({
  host: smtp_host,
  port: smtp_port,
  secure: smtp_secure,
  auth: {
    user: smtp_user,
    pass: smtp_pass,
  },
});

// Optional: verify connection on startup without breaking production
transporter.verify().catch((err) => {
  console.warn("Warning: SMTP connection verification failed:", err.message);
});

const sendMail = async ({ to, subject, text, html }) => {
  if (!to || !subject) {
    throw new Error("Missing required mail fields: 'to' and 'subject'");
  }

  try {
    const info = await transporter.sendMail({
      from: `"${smtp_from_name}" <${smtp_from}>`,
      to,
      subject,
      text,
      html,
    });

    return {
      message_id: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

export { sendMail };
