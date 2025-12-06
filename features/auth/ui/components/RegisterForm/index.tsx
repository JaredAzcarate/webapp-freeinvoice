"use client";

import { useRegister } from "@/features/auth/hooks/useRegister";
import { Button, Form, Input, message } from "antd";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const register = useRegister();

  const onFinish = async (values: {
    email: string;
    password: string;
    name?: string;
  }) => {
    try {
      await register.mutateAsync(values);
      message.success("Registro exitoso. Por favor verifica tu email.");
      router.push("/verify-email?email=" + encodeURIComponent(values.email));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al registrar usuario";
      message.error(errorMessage);
    }
  };

  return (
    <Form
      name="register"
      onFinish={onFinish}
      layout="vertical"
      autoComplete="off"
    >
      <Form.Item label="Nombre (opcional)" name="name">
        <Input placeholder="Tu nombre" />
      </Form.Item>

      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Por favor ingresa tu email" },
          { type: "email", message: "Email inválido" },
        ]}
      >
        <Input placeholder="tu@email.com" />
      </Form.Item>

      <Form.Item
        label="Contraseña"
        name="password"
        rules={[
          { required: true, message: "Por favor ingresa tu contraseña" },
          { min: 8, message: "La contraseña debe tener al menos 8 caracteres" },
        ]}
      >
        <Input.Password placeholder="Mínimo 8 caracteres" />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={register.isPending}
        >
          Registrarse
        </Button>
      </Form.Item>
    </Form>
  );
}
