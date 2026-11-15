import { NextRequest, NextResponse } from "next/server";
import { getMemberByCircleAndRole, getCircle, ensureDemoSeeded } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { Role } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { role } = (await req.json()) as { role: Role };

    if (!["elder", "caretaker", "family"].includes(role)) {
      return NextResponse.json({ error: "Invalid demo role" }, { status: 400 });
    }

    // Make sure the judge demo data exists in Firestore (idempotent, refreshes today's doses)
    await ensureDemoSeeded();

    const circle = await getCircle("CC-DEMO");
    if (!circle) {
      return NextResponse.json({ error: "Demo circle not initialized" }, { status: 404 });
    }

    const member = await getMemberByCircleAndRole("CC-DEMO", role);
    if (!member) {
      return NextResponse.json({ error: "Demo member not found" }, { status: 404 });
    }

    await setSessionCookie({
      memberId: member.id,
      name: member.name,
      role: member.role,
      circleId: circle.id,
      circleName: circle.name,
      elderName: circle.elderName,
      email: member.email,
    });

    return NextResponse.json({
      success: true,
      user: {
        memberId: member.id,
        name: member.name,
        role: member.role,
        circleId: circle.id,
        circleName: circle.name,
        elderName: circle.elderName,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Demo Login Error]:", errorMsg);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
