"use client";

import { CalendarOutlined } from "@ant-design/icons";
import { Card, List, Typography } from "antd";
import { CalendarExampleProps } from "./types";

const { Title, Text } = Typography;

/**
 * Component to display calendar events
 */
export default function CalendarExample({
  events,
}: CalendarExampleProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sin fecha";
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Title level={3} className="mb-4">
        <CalendarOutlined className="mr-2" />
        Próximos Eventos
      </Title>
      {events.length > 0 ? (
        <List
          dataSource={events}
          renderItem={(event) => (
            <List.Item>
              <Card className="w-full">
                <Title level={5}>{event.summary || "Sin título"}</Title>
                <Text type="secondary">
                  Inicio:{" "}
                  {formatDate(event.start?.dateTime || event.start?.date)}
                </Text>
                <br />
                <Text type="secondary">
                  Fin: {formatDate(event.end?.dateTime || event.end?.date)}
                </Text>
                {event.description && (
                  <>
                    <br />
                    <Text>{event.description}</Text>
                  </>
                )}
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Card>
          <Text>No hay eventos próximos</Text>
        </Card>
      )}
    </div>
  );
}

