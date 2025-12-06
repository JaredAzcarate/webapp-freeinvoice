"use client";

import { useDeleteAccount } from "@/features/auth/hooks/useDeleteAccount";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Button, Card, Modal, Typography, message } from "antd";

const { Title, Text, Paragraph } = Typography;

export default function DeleteAccount() {
  const deleteAccount = useDeleteAccount();

  const handleDelete = () => {
    Modal.confirm({
      title: "¿Estás seguro de que quieres eliminar tu cuenta?",
      icon: <ExclamationCircleOutlined />,
      content:
        "Esta acción no se puede deshacer. Todos tus datos serán eliminados permanentemente.",
      okText: "Sí, eliminar cuenta",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await deleteAccount.mutateAsync();
          message.success("Cuenta eliminada exitosamente");
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Error al eliminar cuenta";
          message.error(errorMessage);
        }
      },
    });
  };

  return (
    <Card>
      <Title level={4} type="danger">
        Zona de Peligro
      </Title>
      <Paragraph>
        Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, ten
        cuidado.
      </Paragraph>
      <Button
        type="primary"
        danger
        onClick={handleDelete}
        loading={deleteAccount.isPending}
      >
        Eliminar mi cuenta
      </Button>
    </Card>
  );
}
