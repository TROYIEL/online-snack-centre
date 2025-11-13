import { NextResponse } from "next/server";
import africastalking from "africastalking";

// ✅ Initialize Africa's Talking
const AT = africastalking({
  apiKey: process.env.AFRICASTALKING_API_KEY as string,
  username: process.env.AFRICASTALKING_USERNAME as string,
});

export async function POST(req: Request) {
  try {
    const { phoneNumber, message } = await req.json();

    if (!phoneNumber || !message) {
      return NextResponse.json({ error: "Missing phone number or message" }, { status: 400 });
    }

    const sms = AT.SMS;
    const response = await sms.send({
      to: [phoneNumber],
      message,
      from: "Sandbox", // or your registered short code/sender ID
    });

    console.log("Africa's Talking response:", response);

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("SMS send error:", error);
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}
