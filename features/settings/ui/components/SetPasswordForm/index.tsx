"use client";

import { useSetPassword } from "@/features/auth/hooks/useSetPassword";
import { Button, Form, Input, message } from "antd";

export default function SetPasswordForm() {
  const setPassword = useSetPassword();

  const onFinish = async (values: {
    password: string;
    confirmPassword: string;
  }) => {
    if (values.password !== values.confirmPassword) {
      message.error("Las contraseñas no coinciden");
      return;
    }

    try {
      await setPassword.mutateAsync({ password: values.password });
      message.success("Contraseña establecida exitosamente");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al establecer contraseña";
      message.error(errorMessage);
    }
  };

  return (
    <Form
      name="setPassword"
      onFinish={onFinish}
      layout="vertical"
      autoComplete="off"
    >
      <Form.Item
        label="Nueva contraseña"
        name="password"
        rules={[
          { required: true, message: "Por favor ingresa una contraseña" },
          { min: 8, message: "La contraseña debe tener al menos 8 caracteres" },
        ]}
      >
        <Input.Password placeholder="Mínimo 8 caracteres" />
      </Form.Item>

      <Form.Item
        label="Confirmar contraseña"
        name="confirmPassword"
        dependencies={["password"]}
        rules={[
          { required: true, message: "Por favor confirma tu contraseña" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Las contraseñas no coinciden"));
            },
          }),
        ]}
      >
        <Input.Password placeholder="Confirma tu contraseña" />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={setPassword.isPending}
        >
          Establecer contraseña
        </Button>
      </Form.Item>
    </Form>
  );
}
