import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Webhook endpoint is available. Use POST to send webhook events."
  });
}

export async function POST(req: Request) {
  const secret = req.headers.get("X-Webhook-Secret");

  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({
      success: false,
      error: { code: "INVALID_WEBHOOK_SECRET", message: "Secret mismatch" }
    }, { status: 401 });
  }

  const body = await req.json();
  if (!body.event_id || !body.event_type) {
    return NextResponse.json({
      success: false,
      error: { code: "INVALID_PAYLOAD", message: "event_id and event_type are required" }
    }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: "Webhook accepted",
    event_id: body.event_id
  });
}