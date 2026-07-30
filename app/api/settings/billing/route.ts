import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  getUserBillingSettings,
  updateUserBillingSettings,
} from "@/database/auth/users";
import { PERMISSIONS } from "@/shared/auth/permissions";
import { checkPermission } from "@/shared/auth/rbac";

const MAX_HOURLY_RATE = 999999.99;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type DigestEmailParseResult =
  | { ok: true; value: string | null | undefined }
  | { ok: false };

type ExcludedProjectsParseResult =
  | { ok: true; value: string[] | undefined }
  | { ok: false; error: string };

/**
 * Normalize digest email input: empty/whitespace → null; otherwise trimmed string.
 * Returns ok:false when the value type is invalid.
 */
function parseDigestEmail(value: unknown): DigestEmailParseResult {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }
  if (value === null) {
    return { ok: true, value: null };
  }
  if (typeof value !== "string") {
    return { ok: false };
  }
  const trimmed = value.trim();
  return { ok: true, value: trimmed === "" ? null : trimmed };
}

/**
 * Validate and normalize excludedProjects: trim, drop empties, dedupe
 * case-insensitively keeping first casing. Undefined means "not provided".
 */
function parseExcludedProjects(value: unknown): ExcludedProjectsParseResult {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }
  if (!Array.isArray(value)) {
    return {
      ok: false,
      error: "excludedProjects debe ser un array de strings",
    };
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      return {
        ok: false,
        error: "excludedProjects debe ser un array de strings no vacíos",
      };
    }
    const trimmed = item.trim();
    if (trimmed === "") {
      return {
        ok: false,
        error: "excludedProjects debe ser un array de strings no vacíos",
      };
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(trimmed);
  }

  return { ok: true, value: result };
}

/**
 * GET /api/settings/billing - Return hourly rate, digest email, excluded projects
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
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

    const settings = await getUserBillingSettings(session.user.id);

    if (!settings) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        hourlyRate: settings.hourlyRate,
        digestEmail: settings.digestEmail,
        excludedProjects: settings.excludedProjects,
      },
    });
  } catch (error) {
    console.error("[API /settings/billing] GET Error:", error);
    return NextResponse.json(
      { error: "Error al obtener la configuración de facturación" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/settings/billing - Update hourly rate, digest email, and/or excluded projects
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const hasPermission = await checkPermission(
      session.user.id,
      PERMISSIONS.SETTINGS_UPDATE
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "No tienes permiso para actualizar la configuración" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { hourlyRate } = body;
    const digestEmailParsed = parseDigestEmail(body.digestEmail);
    const excludedProjectsParsed = parseExcludedProjects(body.excludedProjects);

    if (!digestEmailParsed.ok) {
      return NextResponse.json(
        { error: "digestEmail debe ser un string, null o vacío" },
        { status: 400 }
      );
    }

    if (!excludedProjectsParsed.ok) {
      return NextResponse.json(
        { error: excludedProjectsParsed.error },
        { status: 400 }
      );
    }

    const digestEmail = digestEmailParsed.value;
    const excludedProjects = excludedProjectsParsed.value;

    if (
      hourlyRate === undefined &&
      digestEmail === undefined &&
      excludedProjects === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Debes enviar al menos hourlyRate, digestEmail o excludedProjects",
        },
        { status: 400 }
      );
    }

    if (hourlyRate !== undefined && hourlyRate !== null) {
      if (
        typeof hourlyRate !== "number" ||
        !Number.isFinite(hourlyRate) ||
        hourlyRate <= 0 ||
        hourlyRate > MAX_HOURLY_RATE
      ) {
        return NextResponse.json(
          {
            error: `La tarifa horaria debe ser un número mayor que 0 y como máximo ${MAX_HOURLY_RATE}`,
          },
          { status: 400 }
        );
      }
    }

    if (digestEmail !== undefined && digestEmail !== null) {
      if (!EMAIL_REGEX.test(digestEmail)) {
        return NextResponse.json(
          { error: "El correo del resumen semanal no es válido" },
          { status: 400 }
        );
      }
    }

    const success = await updateUserBillingSettings(session.user.id, {
      ...(hourlyRate !== undefined ? { hourlyRate } : {}),
      ...(digestEmail !== undefined ? { digestEmail } : {}),
      ...(excludedProjects !== undefined ? { excludedProjects } : {}),
    });

    if (!success) {
      return NextResponse.json(
        { error: "No se pudo actualizar la configuración de facturación" },
        { status: 400 }
      );
    }

    const settings = await getUserBillingSettings(session.user.id);

    return NextResponse.json({
      data: {
        hourlyRate: settings?.hourlyRate ?? null,
        digestEmail: settings?.digestEmail ?? null,
        excludedProjects: settings?.excludedProjects ?? [],
      },
    });
  } catch (error) {
    console.error("[API /settings/billing] PATCH Error:", error);
    return NextResponse.json(
      { error: "Error al actualizar la configuración de facturación" },
      { status: 500 }
    );
  }
}
