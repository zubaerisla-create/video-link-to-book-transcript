import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, and body (html or text)." },
        { status: 400 }
      );
    }

    const info = await sendEmail({
      to,
      subject,
      html: html || `<p>${text}</p>`,
      text,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error("Nodemailer send-mail error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email." },
      { status: 500 }
    );
  }
}
