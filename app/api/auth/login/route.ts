import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations";
import { getMemberByCircleAndRole, getCircle } from "@/lib/db";
import { verifyPasscode, setSessionCookie, checkRateLimit, resetRateLimit } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const body = await req.json();

    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { circleId, role, passcode } = parseResult.data;

    // Rate Limiting on login per IP + Circle + Role
    const rateLimitKey = `login_${ip}_${circleId}_${role}`;
    const rateCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000); // 5 attempts per 15 min
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Please wait ${rateCheck.resetInSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const circle = await getCircle(circleId);
    if (!circle) {
      return NextResponse.json({ error: "Circle not found. Check your Circle ID." }, { status: 404 });
    }

    const member = await getMemberByCircleAndRole(circleId, role);
    if (!member) {
      return NextResponse.json(
        { error: `No ${role} registered for this circle. You may need to join first.` },
        { status: 404 }
      );
    }

    const isValid = await verifyPasscode(passcode, member.passcodeHash);
    if (!isValid) {
      return NextResponse.json(
        {
          error: `Incorrect passcode for ${role}. Remaining attempts: ${rateCheck.remaining}`,
        },
        { status: 401 }
      );
    }

    // Success: reset rate limit
    resetRateLimit(rateLimitKey);

    // Set signed httpOnly session cookie
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
    console.error("[Login API Error]:", errorMsg);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
