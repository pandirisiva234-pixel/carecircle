import { NextRequest, NextResponse } from "next/server";
import { createCircleSchema } from "@/lib/validations";
import { saveCircle, saveMember, logActivity } from "@/lib/db";
import { hashPasscode, setSessionCookie } from "@/lib/auth";
import { Circle, Member } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCircleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const now = new Date().toISOString();
    const circleId = "CC-" + Math.random().toString(36).substring(2, 6).toUpperCase();

    const circle: Circle = {
      id: circleId,
      name: data.circleName,
      elderName: data.elderName,
      elderAge: data.elderAge,
      elderConditions: data.elderConditions,
      emergencyContact: data.emergencyContact,
      createdAt: now,
      updatedAt: now,
    };
    await saveCircle(circle);

    // 1. Create Elder Member
    const elderMemberId = `mem-elder-${Date.now()}`;
    const elderHash = await hashPasscode(data.elderPasscode);
    const elderMember: Member = {
      id: elderMemberId,
      circleId,
      name: data.elderName,
      role: "elder",
      passcodeHash: elderHash,
      email: data.elderEmail,
      createdAt: now,
    };
    await saveMember(elderMember);

    // 2. If creator is someone else (caretaker or family), create that member too
    let loggedInMember = elderMember;
    if (data.creatorRole !== "elder") {
      const creatorMemberId = `mem-${data.creatorRole}-${Date.now()}`;
      const creatorHash = await hashPasscode(data.creatorPasscode);
      const creatorMember: Member = {
        id: creatorMemberId,
        circleId,
        name: data.creatorName,
        role: data.creatorRole,
        passcodeHash: creatorHash,
        email: data.creatorEmail,
        createdAt: now,
      };
      await saveMember(creatorMember);
      loggedInMember = creatorMember;
    }

    // Activity Log
    await logActivity({
      circleId,
      memberId: loggedInMember.id,
      memberName: loggedInMember.name,
      memberRole: loggedInMember.role,
      action: "CIRCLE_CREATED",
      details: `Created CareCircle "${data.circleName}" for ${data.elderName}`,
      affectsElder: false,
    });

    // Session Cookie
    await setSessionCookie({
      memberId: loggedInMember.id,
      name: loggedInMember.name,
      role: loggedInMember.role,
      circleId,
      circleName: circle.name,
      elderName: circle.elderName,
      email: loggedInMember.email,
    });

    return NextResponse.json({
      success: true,
      circleId,
      user: {
        memberId: loggedInMember.id,
        name: loggedInMember.name,
        role: loggedInMember.role,
        circleId,
        circleName: circle.name,
        elderName: circle.elderName,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Create Circle Error]:", errorMsg);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
