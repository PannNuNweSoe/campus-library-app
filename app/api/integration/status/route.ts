import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      team: process.env.TEAM_NAME || "Group-9",
      service: process.env.SERVICE_NAME || "campus-library",
      status: "ok",
      version: process.env.SERVICE_VERSION || "1.0",
      timestamp: new Date().toISOString()
    }
  });
}