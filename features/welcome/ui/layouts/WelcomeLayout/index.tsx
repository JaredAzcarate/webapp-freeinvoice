"use client";

import { useCalendarEvents } from "@/features/welcome/hooks/useCalendarEvents";
import CalendarExample from "@/features/welcome/ui/components/CalendarExample";
import type { MenuProps } from "antd";
import { Avatar, Card, Dropdown, Spin, Typography } from "antd";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const { Text } = Typography;

export default function WelcomeLayout() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    events,
    isLoading: isLoadingEvents,
    isError,
  } = useCalendarEvents({
    maxResults: 10,
  });

  // Authentication is handled by middleware

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "settings",
      label: "Configuración",
      onClick: () => router.push("/settings"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Cerrar sesión",
      onClick: handleLogout,
    },
  ];

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <div className="flex justify-end p-4">
        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <div className="flex cursor-pointer items-center gap-2">
            <Avatar src={session.user?.image}>
              {session.user?.name?.charAt(0) || session.user?.email?.charAt(0)}
            </Avatar>
            <span className="text-black">
              {session.user?.name || session.user?.email}
            </span>
          </div>
        </Dropdown>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-black mb-4">
            ¡Bienvenido!
          </h1>
          <p className="text-lg text-zinc-600">
            Has iniciado sesión correctamente como{" "}
            <span className="font-medium text-black">
              {session.user?.name || session.user?.email}
            </span>
          </p>
        </div>
        {isLoadingEvents ? (
          <div className="flex justify-center items-center p-8">
            <Spin size="large" />
          </div>
        ) : isError ? (
          <div className="w-full max-w-4xl mx-auto p-4">
            <Card>
              <Text type="danger">Error al cargar eventos</Text>
            </Card>
          </div>
        ) : (
          <CalendarExample events={events} />
        )}
      </div>
    </div>
  );
}
