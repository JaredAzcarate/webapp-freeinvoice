import { NextRequest, NextResponse } from "next/server";
import { getUsersForWeeklyDigest } from "@/database/auth/users";
import { sendWeeklyDigestEmail } from "@/shared/services/email";
import { buildDigestForUser } from "@/shared/utils/weeklyDigest";

type DigestResultStatus = "sent" | "failed" | "skipped";

interface DigestUserResult {
  userId: number;
  email: string;
  status: DigestResultStatus;
  error?: string;
}

/**
 * Authorize cron requests via Bearer CRON_SECRET.
 * Vercel Cron Jobs send this header when CRON_SECRET is configured.
 */
function authorizeCron(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "Configuración de cron incompleta" },
      { status: 401 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

/**
 * Process weekly digest emails for all eligible users.
 * Continues on per-user failures so one bad account does not block the rest.
 */
async function handleWeeklyDigest() {
  const users = await getUsersForWeeklyDigest();

  let sent = 0;
  let failed = 0;
  const skipped = 0;
  const results: DigestUserResult[] = [];

  for (const user of users) {
    try {
      const recipientEmail = user.digest_email?.trim() || user.email;
      const digest = await buildDigestForUser(user);

      await sendWeeklyDigestEmail({
        email: recipientEmail,
        name: user.name,
        weekHours: digest.weekHours,
        weekEarnings: digest.weekEarnings,
        monthHours: digest.monthHours,
        monthEarnings: digest.monthEarnings,
        hourlyRate: digest.hourlyRate,
        projects: digest.projects,
        weekLabel: digest.weekLabel,
        monthLabel: digest.monthLabel,
      });

      sent += 1;
      results.push({
        userId: user.id,
        email: recipientEmail,
        status: "sent",
      });
    } catch (error) {
      failed += 1;
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      const recipientEmail = user.digest_email?.trim() || user.email;

      console.error(
        `[cron/weekly-digest] Failed for userId=${user.id} email=${recipientEmail}:`,
        message
      );

      results.push({
        userId: user.id,
        email: recipientEmail,
        status: "failed",
        error: message,
      });
    }
  }

  return NextResponse.json({
    data: {
      sent,
      failed,
      skipped,
      results,
    },
  });
}

/**
 * GET /api/cron/weekly-digest — Vercel Cron entrypoint (Fridays 17:00 UTC).
 */
export async function GET(request: NextRequest) {
  try {
    const unauthorized = authorizeCron(request);
    if (unauthorized) {
      return unauthorized;
    }

    return await handleWeeklyDigest();
  } catch (error) {
    console.error("[API /cron/weekly-digest] GET Error:", error);
    return NextResponse.json(
      { error: "Error al enviar el resumen semanal" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/weekly-digest — Same handler for manual triggers.
 */
export async function POST(request: NextRequest) {
  try {
    const unauthorized = authorizeCron(request);
    if (unauthorized) {
      return unauthorized;
    }

    return await handleWeeklyDigest();
  } catch (error) {
    console.error("[API /cron/weekly-digest] POST Error:", error);
    return NextResponse.json(
      { error: "Error al enviar el resumen semanal" },
      { status: 500 }
    );
  }
}
