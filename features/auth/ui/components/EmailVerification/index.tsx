"use client";

import { useResendVerification } from "@/features/auth/hooks/useResendVerification";
import { useVerifyEmail } from "@/features/auth/hooks/useVerifyEmail";
import { Button, Card, message, Typography } from "antd";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const { Title, Text, Paragraph } = Typography;

function EmailVerificationContent() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const verifyEmail = useVerifyEmail();
  const resendVerification = useResendVerification();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setToken(params.get("token"));
      setEmail(params.get("email"));
    }
  }, []);

  useEffect(() => {
    if (token) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleVerify = async () => {
    if (!token) return;

    try {
      await verifyEmail.mutateAsync({ token });
      setVerified(true);
      message.success("Email verificado exitosamente");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al verificar email";
      message.error(errorMessage);
    }
  };

  const handleResend = async () => {
    if (!email) {
      message.error("Email no disponible");
      return;
    }

    try {
      await resendVerification.mutateAsync({ email });
      message.success("Email de verificación reenviado");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al reenviar email";
      message.error(errorMessage);
    }
  };

  if (verified) {
    return (
      <Card className="max-w-md mx-auto">
        <Title level={3}>Email Verificado</Title>
        <Paragraph>
          Tu email ha sido verificado exitosamente. Serás redirigido al login...
        </Paragraph>
      </Card>
    );
  }

  if (token) {
    return (
      <Card className="max-w-md mx-auto">
        <Title level={3}>Verificando email...</Title>
        <Text>Por favor espera mientras verificamos tu email.</Text>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <Title level={3}>Verificar Email</Title>
      {email ? (
        <>
          <Paragraph>
            Se ha enviado un email de verificación a <strong>{email}</strong>
          </Paragraph>
          <Paragraph>
            Por favor revisa tu bandeja de entrada y haz clic en el enlace de
            verificación.
          </Paragraph>
          <Button
            type="primary"
            onClick={handleResend}
            loading={resendVerification.isPending}
            block
          >
            Reenviar email de verificación
          </Button>
        </>
      ) : (
        <Paragraph>
          Por favor proporciona un email para enviar el enlace de verificación.
        </Paragraph>
      )}
    </Card>
  );
}

export default function EmailVerification() {
  return (
    <Suspense fallback={<Card>Cargando...</Card>}>
      <EmailVerificationContent />
    </Suspense>
  );
}
