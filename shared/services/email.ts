/**
 * Email service powered by Resend.
 *
 * In development without RESEND_API_KEY, falls back to console.log
 * so local auth flows keep working. Production always requires Resend.
 */

import { Resend } from "resend";

export interface SendVerificationEmailParams {
  email: string;
  token: string;
  name?: string;
}

export interface DigestProjectRow {
  /** Client name or "Sin proyecto" */
  project: string;
  hours: number;
  /** hours * hourly rate */
  earnings: number;
}

export interface SendWeeklyDigestEmailParams {
  email: string;
  name?: string | null;
  weekHours: number;
  weekEarnings: number;
  monthHours: number;
  monthEarnings: number;
  hourlyRate: number;
  /** Month-to-date breakdown by project (for the table) */
  projects: DigestProjectRow[];
  /** Display strings for period labels, e.g. week range and month name */
  weekLabel: string;
  monthLabel: string;
}

/**
 * Formats a number as hours with exactly 2 decimal places.
 */
function formatHours(value: number): string {
  return value.toFixed(2);
}

/**
 * Formats a number as EUR currency with exactly 2 decimal places.
 */
function formatEur(value: number): string {
  return `${value.toFixed(2)} €`;
}

/**
 * Escapes HTML special characters to prevent injection in email templates.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Resolves the Resend client and from-address for production sends.
 * Returns null when running in development without an API key (console fallback).
 */
function getResendClient(): { resend: Resend; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const isDev = process.env.NODE_ENV === "development";

  if (!apiKey) {
    if (isDev) {
      return null;
    }
    throw new Error("RESEND_API_KEY is required in production");
  }

  if (!from) {
    if (isDev) {
      console.warn(
        "[email] EMAIL_FROM is not set; using fallback FreeInvoice <onboarding@resend.dev>"
      );
      return {
        resend: new Resend(apiKey),
        from: "FreeInvoice <onboarding@resend.dev>",
      };
    }
    throw new Error("EMAIL_FROM is required in production");
  }

  return { resend: new Resend(apiKey), from };
}

/**
 * Sends a verification email with a link to confirm the user's address.
 * In development without RESEND_API_KEY, logs the link to the console instead.
 */
export async function sendVerificationEmail({
  email,
  token,
  name,
}: SendVerificationEmailParams): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  const displayName = name || "Usuario";

  const client = getResendClient();

  if (!client) {
    console.log("=== EMAIL DE VERIFICACIÓN ===");
    console.log(`Para: ${email}`);
    console.log(`Nombre: ${displayName}`);
    console.log(`Link de verificación: ${verificationUrl}`);
    console.log("============================");
    return;
  }

  const { resend, from } = client;

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Verifica tu email — FreeInvoice",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h1 style="font-size: 20px; margin-bottom: 16px;">Verifica tu email</h1>
        <p>Hola ${escapeHtml(displayName)},</p>
        <p>Gracias por registrarte en FreeInvoice. Haz clic en el botón para verificar tu dirección de email:</p>
        <p style="margin: 24px 0;">
          <a href="${escapeHtml(verificationUrl)}"
             style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Verificar email
          </a>
        </p>
        <p style="font-size: 13px; color: #666;">
          O copia y pega este enlace en tu navegador:<br />
          <a href="${escapeHtml(verificationUrl)}" style="color: #666;">${escapeHtml(verificationUrl)}</a>
        </p>
        <p style="font-size: 13px; color: #999; margin-top: 32px;">
          Si no creaste una cuenta en FreeInvoice, puedes ignorar este mensaje.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

/**
 * Builds HTML body for the weekly digest email.
 */
function buildWeeklyDigestHtml(params: SendWeeklyDigestEmailParams): string {
  const {
    name,
    weekHours,
    weekEarnings,
    monthHours,
    monthEarnings,
    hourlyRate,
    projects,
    weekLabel,
    monthLabel,
  } = params;

  const displayName = name?.trim() || "Usuario";

  const projectRows = projects
    .map(
      (row) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;">${escapeHtml(row.project)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatHours(row.hours)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatEur(row.earnings)}</td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <h1 style="font-size: 20px; margin-bottom: 8px;">Resumen semanal</h1>
      <p>Hola ${escapeHtml(displayName)},</p>
      <p>Aquí tienes el resumen de tu actividad en FreeInvoice.</p>

      <div style="background: #f7f7f7; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 4px; font-size: 13px; color: #666;">Esta semana (${escapeHtml(weekLabel)})</p>
        <p style="margin: 0; font-size: 18px; font-weight: 600;">
          ${formatHours(weekHours)} h · ${formatEur(weekEarnings)}
        </p>
      </div>

      <div style="background: #f7f7f7; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 4px; font-size: 13px; color: #666;">Mes hasta hoy (${escapeHtml(monthLabel)})</p>
        <p style="margin: 0; font-size: 18px; font-weight: 600;">
          ${formatHours(monthHours)} h · ${formatEur(monthEarnings)}
        </p>
      </div>

      <p style="font-size: 13px; color: #666;">
        Tarifa horaria aplicada: <strong>${formatEur(hourlyRate)}/h</strong>
      </p>

      <h2 style="font-size: 16px; margin: 24px 0 12px;">Desglose por proyecto (mes)</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="padding: 8px 12px; text-align: left;">Proyecto</th>
            <th style="padding: 8px 12px; text-align: right;">Horas</th>
            <th style="padding: 8px 12px; text-align: right;">Importe (€)</th>
          </tr>
        </thead>
        <tbody>
          ${
            projectRows ||
            `<tr>
              <td colspan="3" style="padding: 12px; color: #999; text-align: center;">
                Sin horas registradas este mes
              </td>
            </tr>`
          }
        </tbody>
        <tfoot>
          <tr style="font-weight: 600;">
            <td style="padding: 8px 12px; border-top: 2px solid #1a1a1a;">Totales</td>
            <td style="padding: 8px 12px; border-top: 2px solid #1a1a1a; text-align: right;">${formatHours(monthHours)}</td>
            <td style="padding: 8px 12px; border-top: 2px solid #1a1a1a; text-align: right;">${formatEur(monthEarnings)}</td>
          </tr>
        </tfoot>
      </table>

      <p style="font-size: 12px; color: #999; margin-top: 32px;">
        Este email es un resumen automático de FreeInvoice.
      </p>
    </div>
  `;
}

/**
 * Sends the weekly hours/earnings digest email.
 * In development without RESEND_API_KEY, logs a summary to the console instead.
 */
export async function sendWeeklyDigestEmail(
  params: SendWeeklyDigestEmailParams
): Promise<void> {
  const { email, weekHours, weekEarnings } = params;
  const subject = `Resumen semanal — ${formatHours(weekHours)}h · ${formatEur(weekEarnings)}`;

  const client = getResendClient();

  if (!client) {
    console.log("=== EMAIL RESUMEN SEMANAL ===");
    console.log(`Para: ${email}`);
    console.log(`Asunto: ${subject}`);
    console.log(
      `Semana: ${formatHours(params.weekHours)} h · ${formatEur(params.weekEarnings)}`
    );
    console.log(
      `Mes: ${formatHours(params.monthHours)} h · ${formatEur(params.monthEarnings)}`
    );
    console.log(`Proyectos: ${params.projects.length}`);
    console.log("=============================");
    return;
  }

  const { resend, from } = client;

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject,
    html: buildWeeklyDigestHtml(params),
  });

  if (error) {
    throw new Error(`Failed to send weekly digest email: ${error.message}`);
  }
}
