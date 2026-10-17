import nodemailer from "nodemailer";

export const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: (process.env.SMTP_PASSWORD || "").replace(/\s+/g, ""),
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const fromAddress = process.env.SMTP_FROM || `"Transcriptly" <${process.env.SMTP_USER || "zubaerisla@gmail.com"}>`;
  
  return mailTransporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text: text || html.replace(/<[^>]+>/g, ""),
    html,
  });
}
