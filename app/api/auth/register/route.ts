import { createUserWithPassword, getUserByEmail } from "@/database/auth/users";
import { sendVerificationEmail } from "@/shared/services/email";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/register - Register new user with email/password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      );
    }

    const user = await createUserWithPassword(email, password, name);

    await sendVerificationEmail({
      email: user.email,
      token: user.verification_token!,
      name: user.name || undefined,
    });

    return NextResponse.json({
      data: {
        success: true,
        message: "Usuario registrado. Por favor verifica tu email.",
      },
    });
  } catch (error) {
    console.error("[API /auth/register] Error:", error);
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 }
    );
  }
}
