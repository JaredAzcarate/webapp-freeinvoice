import { deleteUser } from "@/database/users";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../[...nextauth]/route";

/**
 * DELETE /api/auth/delete-account - Delete user account
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const success = await deleteUser(session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Error al eliminar cuenta" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        success: true,
      },
    });
  } catch (error) {
    console.error("[API /auth/delete-account] Error:", error);
    return NextResponse.json(
      { error: "Error al eliminar cuenta" },
      { status: 500 }
    );
  }
}
