"use client";

import { Button, Form, Input, message } from "antd";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "Email no verificado") {
          message.error("Por favor verifica tu email antes de iniciar sesión");
        } else {
          message.error("Email o contraseña incorrectos");
        }
      } else {
        message.success("Inicio de sesión exitoso");
        window.location.href = "/welcome";
      }
    } catch (error) {
      message.error("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form name="login" onFinish={onFinish} layout="vertical" autoComplete="off">
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
        rules={[{ required: true, message: "Por favor ingresa tu contraseña" }]}
      >
        <Input.Password placeholder="Tu contraseña" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Iniciar sesión
        </Button>
      </Form.Item>
    </Form>
  );
}
