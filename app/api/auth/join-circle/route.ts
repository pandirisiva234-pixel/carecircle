import { NextRequest, NextResponse } from "next/server";
import { joinCircleSchema } from "@/lib/validations";
import { getCircle, saveMember, logActivity, getMemberByCircleAndRole } from "@/lib/db";
import { hashPasscode, setSessionCookie } from "@/lib/auth";
import { Member } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = joinCircleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { circleId, memberName, role, passcode, email, phone } = parsed.data;

    const circle = await getCircle(circleId);
    if (!circle) {
      return NextResponse.json({ error: "Care Circle not found with ID " + circleId }, { status: 404 });
    }

    // Check if role already occupied
    const existing = await getMemberByCircleAndRole(circleId, role);
    if (existing) {
      return NextResponse.json(
        { error: `A member with role "${role}" already exists in this circle. Please log in directly.` },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const passcodeHash = await hashPasscode(passcode);
    const memberId = `mem-${role}-${Date.now()}`;

    const member: Member = {
      id: memberId,
      circleId,
      name: memberName,
      role,
      passcodeHash,
      email,
      phone,
      createdAt: now,
    };

    await saveMember(member);

    await logActivity({
      circleId,
      memberId: member.id,
      memberName: member.name,
      memberRole: member.role,
      action: "MEMBER_JOINED",
      details: `${memberName} joined the CareCircle as ${role}`,
      affectsElder: true,
    });

    await setSessionCookie({
      memberId: member.id,
      name: member.name,
      role: member.role,
      circleId,
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
        circleId,
        circleName: circle.name,
        elderName: circle.elderName,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Join Circle Error]:", errorMsg);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
