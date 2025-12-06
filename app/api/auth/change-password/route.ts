import { updatePassword } from "@/database/users";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../[...nextauth]/route";

/**
 * POST /api/auth/change-password - Change user password
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Contraseña actual y nueva contraseña son requeridas" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const success = await updatePassword(
      session.user.id,
      currentPassword,
      newPassword
    );

    if (!success) {
      return NextResponse.json(
        { error: "Contraseña actual incorrecta" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: {
        success: true,
      },
    });
  } catch (error) {
    console.error("[API /auth/change-password] Error:", error);
    return NextResponse.json(
      { error: "Error al cambiar contraseña" },
      { status: 500 }
    );
  }
}
