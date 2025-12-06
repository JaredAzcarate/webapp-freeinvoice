"use client";

import { useChangePassword } from "@/features/auth/hooks/useChangePassword";
import { Button, Form, Input, message } from "antd";

export default function ChangePasswordForm() {
  const changePassword = useChangePassword();

  const onFinish = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error("Las contraseñas no coinciden");
      return;
    }

    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success("Contraseña actualizada exitosamente");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al cambiar contraseña";
      message.error(errorMessage);
    }
  };

  return (
    <Form
      name="changePassword"
      onFinish={onFinish}
      layout="vertical"
      autoComplete="off"
    >
      <Form.Item
        label="Contraseña actual"
        name="currentPassword"
        rules={[
          { required: true, message: "Por favor ingresa tu contraseña actual" },
        ]}
      >
        <Input.Password placeholder="Tu contraseña actual" />
      </Form.Item>

      <Form.Item
        label="Nueva contraseña"
        name="newPassword"
        rules={[
          { required: true, message: "Por favor ingresa una nueva contraseña" },
          { min: 8, message: "La contraseña debe tener al menos 8 caracteres" },
        ]}
      >
        <Input.Password placeholder="Mínimo 8 caracteres" />
      </Form.Item>

      <Form.Item
        label="Confirmar nueva contraseña"
        name="confirmPassword"
        dependencies={["newPassword"]}
        rules={[
          { required: true, message: "Por favor confirma tu nueva contraseña" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("newPassword") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Las contraseñas no coinciden"));
            },
          }),
        ]}
      >
        <Input.Password placeholder="Confirma tu nueva contraseña" />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={changePassword.isPending}
        >
          Cambiar contraseña
        </Button>
      </Form.Item>
    </Form>
  );
}
