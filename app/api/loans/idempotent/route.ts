import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

async function sendWebhookToPartner(payload: any) {
  try {
    const res = await fetch(process.env.PARTNER_WEBHOOK_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.PARTNER_WEBHOOK_SECRET!
      },
      body: JSON.stringify(payload)
    });
    return { status: res.status, body: await res.text() };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function POST(req: Request) {
  const key = req.headers.get("Idempotency-Key");
  if (!key) {
    return NextResponse.json({
      success: false,
      error: { code: "MISSING_IDEMPOTENCY_KEY", message: "Idempotency-Key header is required" }
    }, { status: 400 });
  }

  // Check DB for existing key
  const { data: existingKey } = await supabase
    .from("idempotency_keys")
    .select("response_body")
    .eq("key", key)
    .single();

  if (existingKey) {
    return NextResponse.json({
      ...existingKey.response_body,
      idempotent_replay: true
    });
  }

  const body = await req.json();
  const loanData = {
    id: crypto.randomUUID(),
    copy_id: body.copy_id || "copy-001",
    user_id: body.user_id || "user-123",
    status: "active",
    created_at: new Date().toISOString()
  };

  const eventPayload = {
    event_id: crypto.randomUUID(),
    event_type: "loan.created",
    occurred_at: new Date().toISOString(),
    source: process.env.TEAM_NAME || "Group-9",
    data: loanData
  };
  const partnerResponse = await sendWebhookToPartner(eventPayload);

  const responsePayload = {
    success: true,
    data: loanData,
    webhook_delivery: partnerResponse,
    idempotent_replay: false
  };

  await supabase.from("idempotency_keys").insert({
    key: key,
    response_body: responsePayload
  });

  return NextResponse.json(responsePayload);
}