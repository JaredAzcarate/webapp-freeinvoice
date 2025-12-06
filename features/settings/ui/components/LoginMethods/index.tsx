"use client";

import { useLoginMethods } from "@/features/auth/hooks/useLoginMethods";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Card, Spin, Tag, Typography } from "antd";

const { Title, Text } = Typography;

export default function LoginMethods() {
  const { data, isLoading } = useLoginMethods();

  if (isLoading) {
    return <Spin />;
  }

  return (
    <Card>
      <Title level={4}>Métodos de Login Disponibles</Title>
      <div className="space-y-2 mt-4">
        <div className="flex items-center justify-between">
          <Text>Email y Contraseña</Text>
          {data?.hasPassword ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              Configurado
            </Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="default">
              No configurado
            </Tag>
          )}
        </div>
        <div className="flex items-center justify-between">
          <Text>Google</Text>
          {data?.hasGoogle ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              Configurado
            </Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="default">
              No configurado
            </Tag>
          )}
        </div>
      </div>
    </Card>
  );
}
