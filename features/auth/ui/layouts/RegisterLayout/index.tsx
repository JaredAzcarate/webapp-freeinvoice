"use client";

import RegisterForm from "@/features/auth/ui/components/RegisterForm";
import { Typography } from "antd";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function RegisterLayout() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <Title level={2} className="mb-2">
            Crear cuenta
          </Title>
          <Text type="secondary">
            Regístrate para comenzar a usar FreeInvoice
          </Text>
        </div>

        <RegisterForm />

        <div className="text-center mt-4">
          <Text type="secondary">
            ¿Ya tienes cuenta?{" "}
            <a
              onClick={() => router.push("/")}
              className="cursor-pointer text-blue-500 hover:text-blue-600"
            >
              Inicia sesión
            </a>
          </Text>
        </div>
      </div>
    </div>
  );
}
