import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || smtpUser;
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpSecure = process.env.SMTP_SECURE === "true";


if (!smtpUser || !smtpPass) {
  console.warn(
    "SMTP_USER or SMTP_PASS not set — email sending will fail until configured",
  );
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  requireTLS: true,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

const sendMail = async ({ to, subject, text, html }) => {
  if (!smtpUser || !smtpPass) {
    throw new Error("SMTP credentials not configured");
  }

  const info = await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    text,
    html,
  });

  return info;
};

export { sendMail };
