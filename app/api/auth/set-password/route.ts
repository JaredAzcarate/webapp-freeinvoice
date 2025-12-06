import { setPassword } from "@/database/users";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../[...nextauth]/route";

/**
 * POST /api/auth/set-password - Set password for users without password (e.g., Google-only users)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Contraseña requerida" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const success = await setPassword(session.user.id, password);

    if (!success) {
      return NextResponse.json(
        { error: "El usuario ya tiene una contraseña establecida" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: {
        success: true,
      },
    });
  } catch (error) {
    console.error("[API /auth/set-password] Error:", error);
    return NextResponse.json(
      { error: "Error al establecer contraseña" },
      { status: 500 }
    );
  }
}
