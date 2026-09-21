import { NextResponse } from "next/server";

async function fetchWithTimeout(url: string, timeoutMs = 3000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeout);
    return res;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export async function GET() {
  const partnerUrl = process.env.PARTNER_API_URL;

  if (!partnerUrl) {
    return NextResponse.json({
      success: false,
      error: { code: "MISSING_CONFIG", message: "PARTNER_API_URL is not configured." }
    }, { status: 500 });
  }

  try {
    const response = await fetchWithTimeout(partnerUrl, 3000);
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: { code: "PARTNER_HTTP_ERROR", status: response.status, retryable: true }
      }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json({ success: true, partner_data: data });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: "DEPENDENCY_TIMEOUT_OR_NETWORK_ERROR",
        message: "Partner API is unavailable or timed out after 3000ms.",
        dependency: "partner-api",
        timeout_ms: 3000,
        retryable: true
      }
    }, { status: 503 });
  }
}