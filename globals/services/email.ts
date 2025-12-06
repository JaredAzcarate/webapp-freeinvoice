/**
 * Email service for sending verification emails
 *
 * In development, this logs to console.
 * In production, replace with actual email service (Resend, SendGrid, etc.)
 */

interface SendVerificationEmailParams {
  email: string;
  token: string;
  name?: string;
}

/**
 * Send verification email
 */
export async function sendVerificationEmail({
  email,
  token,
  name,
}: SendVerificationEmailParams): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  if (process.env.NODE_ENV === "development") {
    console.log("=== EMAIL DE VERIFICACIÓN ===");
    console.log(`Para: ${email}`);
    console.log(`Nombre: ${name || "Usuario"}`);
    console.log(`Link de verificación: ${verificationUrl}`);
    console.log("============================");
    return;
  }

  // TODO: Implementar servicio real de email (Resend, SendGrid, etc.)
  // Ejemplo con Resend:
  // await resend.emails.send({
  //   from: "noreply@freeinvoice.com",
  //   to: email,
  //   subject: "Verifica tu email",
  //   html: `...`
  // });

  throw new Error("Email service not implemented for production");
}
