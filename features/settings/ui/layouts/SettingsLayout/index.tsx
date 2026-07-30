"use client";

import { useLoginMethods } from "@/features/auth/hooks/useLoginMethods";
import { useBillingSettings } from "@/features/settings/hooks/useBillingSettings";
import { useProjectOptions } from "@/features/settings/hooks/useProjectOptions";
import BillingSettingsForm from "@/features/settings/ui/components/BillingSettingsForm";
import ChangePasswordForm from "@/features/settings/ui/components/ChangePasswordForm";
import DeleteAccount from "@/features/settings/ui/components/DeleteAccount";
import LoginMethods from "@/features/settings/ui/components/LoginMethods";
import SetPasswordForm from "@/features/settings/ui/components/SetPasswordForm";
import { Alert, Card, Spin, Tabs, Typography } from "antd";
import { useSession } from "next-auth/react";

const { Title } = Typography;

export default function SettingsLayout() {
  const { data: session, status } = useSession();
  const { data: loginMethods, isLoading: isLoadingMethods } = useLoginMethods();
  const {
    data: billingData,
    isLoading: isLoadingBilling,
    isError: isBillingError,
    error: billingError,
    updateBillingSettings,
    isUpdating,
  } = useBillingSettings();
  const {
    data: projectOptionsData,
    isLoading: isLoadingProjects,
  } = useProjectOptions();

  // Authentication is handled by middleware

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

  const billingTabContent = (
    <Card>
      <Title level={4}>Facturación</Title>
      <p className="mb-4 text-gray-600">
        Define tu tarifa por hora y el correo del resumen semanal de
        facturación.
      </p>
      {isLoadingBilling ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      ) : isBillingError ? (
        <Alert
          type="error"
          message={
            billingError instanceof Error
              ? billingError.message
              : "Error al cargar la configuración de facturación"
          }
          showIcon
        />
      ) : (
        <BillingSettingsForm
          hourlyRate={billingData?.hourlyRate ?? null}
          digestEmail={billingData?.digestEmail ?? null}
          excludedProjects={billingData?.excludedProjects ?? []}
          projectOptions={projectOptionsData?.projects ?? []}
          isLoadingProjects={isLoadingProjects}
          isSaving={isUpdating}
          onSave={async ({ hourlyRate, digestEmail, excludedProjects }) => {
            await updateBillingSettings({
              hourlyRate,
              digestEmail,
              excludedProjects,
            });
          }}
        />
      )}
    </Card>
  );

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
      key: "billing",
      label: "Facturación",
      children: billingTabContent,
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
