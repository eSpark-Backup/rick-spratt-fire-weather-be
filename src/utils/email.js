import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const smtp_host = process.env.SMTP_HOST || "smtp.gmail.com";
const smtp_user = process.env.SMTP_USER;
const smtp_pass = process.env.SMTP_PASS;
const smtp_from = process.env.SMTP_FROM || smtp_user;
const smtp_port = Number(process.env.SMTP_PORT) || 587;
const smtp_secure = process.env.SMTP_SECURE === "true";

if (!smtp_user || !smtp_pass) {
  throw new Error("SMTP credentials are missing in environment variables");
}

const transporter = nodemailer.createTransport({
  host: smtp_host,
  port: smtp_port,
  secure: smtp_secure,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  auth: {
    user: smtp_user,
    pass: smtp_pass,
  },
  tls: {
    rejectUnauthorized: true,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

await transporter.verify();

const sendMail = async ({ to, subject, text, html }) => {
  if (!to || !subject) {
    throw new Error("Missing required mail fields");
  }

  try {
    const info = await transporter.sendMail({
      from: smtp_from,
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
