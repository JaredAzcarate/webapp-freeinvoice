import { PERMISSIONS } from "@/shared/auth/permissions";
import { checkPermission } from "@/shared/auth/rbac";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "No autenticado o sin token de acceso" },
        { status: 401 }
      );
    }

    if (!session.user.id) {
      return NextResponse.json(
        { error: "Usuario no identificado" },
        { status: 401 }
      );
    }

    // Check permission
    const hasPermission = await checkPermission(
      session.user.id,
      PERMISSIONS.CALENDAR_READ
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "No tienes permiso para ver eventos" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get("timeMin") || new Date().toISOString();
    const timeMax = searchParams.get("timeMax");
    const maxResults = searchParams.get("maxResults") || "10";

    const allEvents: any[] = [];
    let pageToken: string | null = null;

    do {
      const urlParams = new URLSearchParams({
        timeMin,
        maxResults,
        singleEvents: "true",
        orderBy: "startTime",
      });

      if (timeMax) {
        urlParams.set("timeMax", timeMax);
      }

      if (pageToken) {
        urlParams.set("pageToken", pageToken);
      }

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${urlParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return NextResponse.json(
          { error: "Error al obtener eventos", details: error },
          { status: response.status }
        );
      }

      const data = await response.json();
      allEvents.push(...(data.items || []));
      pageToken = data.nextPageToken || null;
    } while (pageToken);

    return NextResponse.json({
      data: allEvents,
      total: allEvents.length,
    });
  } catch (error) {
    console.error("Error en API de calendario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
