import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    // Store contact message (in a real app, save to DB or send email)
    console.log("Contact form submission:", { name, email, subject, message });

    return NextResponse.json({ message: "تم إرسال رسالتك بنجاح. سنتواصل معك قريباً." });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
