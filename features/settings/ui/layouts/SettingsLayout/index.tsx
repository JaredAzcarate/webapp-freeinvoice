"use client";

import { useLoginMethods } from "@/features/auth/hooks/useLoginMethods";
import ChangePasswordForm from "@/features/settings/ui/components/ChangePasswordForm";
import DeleteAccount from "@/features/settings/ui/components/DeleteAccount";
import LoginMethods from "@/features/settings/ui/components/LoginMethods";
import SetPasswordForm from "@/features/settings/ui/components/SetPasswordForm";
import { Card, Spin, Tabs, Typography } from "antd";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const { Title } = Typography;

export default function SettingsLayout() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: loginMethods, isLoading: isLoadingMethods } = useLoginMethods();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading" || isLoadingMethods) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const tabItems = [
    {
      key: "login-methods",
      label: "Métodos de Login",
      children: <LoginMethods />,
    },
    {
      key: "password",
      label: loginMethods?.hasPassword
        ? "Cambiar Contraseña"
        : "Establecer Contraseña",
      children: loginMethods?.hasPassword ? (
        <Card>
          <Title level={4}>Cambiar Contraseña</Title>
          <ChangePasswordForm />
        </Card>
      ) : (
        <Card>
          <Title level={4}>Establecer Contraseña</Title>
          <p className="mb-4 text-gray-600">
            Establece una contraseña para poder iniciar sesión con tu email y
            contraseña.
          </p>
          <SetPasswordForm />
        </Card>
      ),
    },
    {
      key: "danger",
      label: "Eliminar Cuenta",
      children: <DeleteAccount />,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Title level={2} className="mb-6">
          Configuración
        </Title>
        <Tabs items={tabItems} />
      </div>
    </div>
  );
}
