import { getUserLoginMethods } from "@/database/users";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../[...nextauth]/route";

/**
 * GET /api/auth/login-methods - Get available login methods for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const methods = await getUserLoginMethods(session.user.id);

    return NextResponse.json({
      data: methods,
    });
  } catch (error) {
    console.error("[API /auth/login-methods] Error:", error);
    return NextResponse.json(
      { error: "Error al obtener métodos de login" },
      { status: 500 }
    );
  }
}
