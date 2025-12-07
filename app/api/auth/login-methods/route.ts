import { getUserLoginMethods } from "@/database/auth/users";
import { PERMISSIONS } from "@/shared/auth/permissions";
import { checkPermission } from "@/shared/auth/rbac";
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

    // Check permission
    const hasPermission = await checkPermission(
      session.user.id,
      PERMISSIONS.AUTH_READ
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "No tienes permiso para ver métodos de login" },
        { status: 403 }
      );
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
