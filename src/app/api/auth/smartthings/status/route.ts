import { NextResponse } from "next/server";
import { isSmartThingsConnected } from "@/lib/smartthings-auth";

export async function GET() {
  return NextResponse.json({ connected: isSmartThingsConnected() });
}
