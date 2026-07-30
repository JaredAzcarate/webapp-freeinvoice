import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PERMISSIONS } from "@/shared/auth/permissions";
import { checkPermission } from "@/shared/auth/rbac";
import { fetchPrimaryCalendarEvents } from "@/shared/services/googleCalendar";
import { extractClientFromSummary } from "@/shared/utils/googleCalendarEvents";

const NO_PROJECT_LABEL = "Sin proyecto";
const LOOKBACK_DAYS = 90;

/**
 * GET /api/settings/project-options
 * Unique client/project names from the user's Google Calendar (last ~90 days).
 * Always appends "Sin proyecto" at the end for events without a client.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (!session.accessToken) {
      return NextResponse.json(
        {
          error:
            "No hay acceso a Google Calendar. Vuelve a iniciar sesión con Google para reconectar.",
        },
        { status: 401 }
      );
    }

    const hasPermission = await checkPermission(
      session.user.id,
      PERMISSIONS.SETTINGS_READ
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "No tienes permiso para ver la configuración" },
        { status: 403 }
      );
    }

    const timeMax = new Date();
    const timeMin = new Date(timeMax);
    timeMin.setDate(timeMin.getDate() - LOOKBACK_DAYS);

    const events = await fetchPrimaryCalendarEvents(
      session.accessToken,
      timeMin.toISOString(),
      timeMax.toISOString()
    );

    const projects = new Set<string>();

    for (const event of events) {
      const client = extractClientFromSummary(event.summary || "");
      if (client) {
        projects.add(client);
      }
    }

    const sorted = Array.from(projects).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
    sorted.push(NO_PROJECT_LABEL);

    return NextResponse.json({
      data: {
        projects: sorted,
      },
    });
  } catch (error) {
    console.error("[API /settings/project-options] GET Error:", error);
    return NextResponse.json(
      { error: "Error al obtener los proyectos del calendario" },
      { status: 500 }
    );
  }
}
