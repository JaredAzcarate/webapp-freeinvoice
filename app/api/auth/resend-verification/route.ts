import { getUserByEmail, updateVerificationToken } from "@/database/users";
import { sendVerificationEmail } from "@/globals/services/email";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/resend-verification - Resend verification email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (user.email_verified) {
      return NextResponse.json(
        { error: "El email ya está verificado" },
        { status: 400 }
      );
    }

    const token = await updateVerificationToken(email);

    await sendVerificationEmail({
      email: user.email,
      token,
      name: user.name || undefined,
    });

    return NextResponse.json({
      data: {
        success: true,
      },
    });
  } catch (error) {
    console.error("[API /auth/resend-verification] Error:", error);
    return NextResponse.json(
      { error: "Error al reenviar email de verificación" },
      { status: 500 }
    );
  }
}
