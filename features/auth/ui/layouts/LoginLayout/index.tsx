"use client";

import LoginForm from "@/features/auth/ui/components/LoginForm";
import { Button, Divider, Spin, Typography } from "antd";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function LoginLayout() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect is handled by middleware

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Spin size="large" />
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <Title level={2} className="mb-2">
            FreeInvoice
          </Title>
          <Text type="secondary">Inicia sesión para continuar</Text>
        </div>

        <LoginForm />

        <Divider>O</Divider>

        <Button
          type="default"
          size="large"
          block
          onClick={() => signIn("google", { callbackUrl: "/welcome" })}
        >
          Iniciar sesión con Google
        </Button>

        <div className="text-center mt-4">
          <Text type="secondary">
            ¿No tienes cuenta?{" "}
            <a
              onClick={() => router.push("/register")}
              className="cursor-pointer text-blue-500 hover:text-blue-600"
            >
              Regístrate
            </a>
          </Text>
        </div>
      </div>
    </div>
  );
}
