import { verifyUserEmail } from "@/database/auth/users";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/verify-email - Verify user email with token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token de verificación requerido" },
        { status: 400 }
      );
    }

    const user = await verifyUserEmail(token);

    if (!user) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: {
        success: true,
      },
    });
  } catch (error) {
    console.error("[API /auth/verify-email] Error:", error);
    return NextResponse.json(
      { error: "Error al verificar email" },
      { status: 500 }
    );
  }
}
