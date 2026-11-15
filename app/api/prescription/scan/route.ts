import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { extractMedicationsFromImage } from "@/lib/gemini";
import { logActivity } from "@/lib/db";

export const maxDuration = 60; // Allow sufficient time for AI OCR

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const result = await extractMedicationsFromImage(imageBase64, mimeType || "image/jpeg");

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to extract medications from prescription" },
        { status: 500 }
      );
    }

    // Log Activity
    await logActivity({
      circleId: session.circleId,
      memberId: session.memberId,
      memberName: session.name,
      memberRole: session.role,
      action: "PRESCRIPTION_SCANNED",
      details: `${session.name} scanned a prescription using Gemini AI, found ${result.data.length} medicines`,
      affectsElder: true,
    });

    return NextResponse.json({
      success: true,
      medications: result.data,
      rawSummary: result.rawText,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Prescription Scan Error]:", errorMsg);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
