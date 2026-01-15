"use client";

import { CalendarOutlined, FilePdfOutlined } from "@ant-design/icons";
import { Button, Card, Select, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CalendarExampleProps } from "./types";
import { ProcessedEvent } from "@/shared/hooks/useEventsByGoogle";

const { Title, Text } = Typography;

interface TableEvent extends ProcessedEvent {
  date: string;
  dateFormatted: string;
  key: string;
}

/**
 * Component to display calendar events in a table
 */
export default function CalendarExample({
  eventsByDay,
  timeFilter = "week",
  dateRange,
}: CalendarExampleProps) {
  // Flatten events for table display
  const allEvents: TableEvent[] = eventsByDay.flatMap(({ date, dateFormatted, events }) =>
    events.map((event) => ({
      ...event,
      date,
      dateFormatted,
      key: event.id,
    }))
  );

  // Extract unique clients
  const clients = useMemo(() => {
    const clientSet = new Set<string>();
    allEvents.forEach((event) => {
      if (event.client) {
        clientSet.add(event.client);
      }
    });
    return Array.from(clientSet).sort();
  }, [allEvents]);

  // Filter state - now supports multiple clients
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // Filter events by selected clients
  const tableData = useMemo(() => {
    if (selectedClients.length === 0) {
      return allEvents;
    }
    return allEvents.filter((event) =>
      event.client && selectedClients.includes(event.client)
    );
  }, [allEvents, selectedClients]);

  // Calculate total hours worked
  const totalHours = useMemo(() => {
    return tableData.reduce((total, event) => {
      if (event.duration) {
        return (
          total +
          event.duration.hours +
          event.duration.minutes / 60 +
          event.duration.seconds / 3600
        );
      }
      return total;
    }, 0);
  }, [tableData]);

  // Format total hours for display
  const formatTotalHours = (hours: number): string => {
    const totalHoursInt = Math.floor(hours);
    const minutes = Math.floor((hours - totalHoursInt) * 60);
    const seconds = Math.floor(((hours - totalHoursInt) * 60 - minutes) * 60);

    if (totalHoursInt === 0 && minutes === 0 && seconds === 0) {
      return "0 horas";
    }

    const parts: string[] = [];
    if (totalHoursInt > 0) {
      parts.push(`${totalHoursInt} ${totalHoursInt === 1 ? "hora" : "horas"}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} ${minutes === 1 ? "minuto" : "minutos"}`);
    }
    if (seconds > 0 && totalHoursInt === 0) {
      parts.push(`${seconds} ${seconds === 1 ? "segundo" : "segundos"}`);
    }

    return parts.join(" ");
  };

  // Format duration for PDF
  const formatDurationForPDF = (duration: {
    hours: number;
    minutes: number;
    seconds: number;
  }): string => {
    return `${duration.hours}h ${duration.minutes}m ${duration.seconds}s`;
  };

  // Get filter label
  const getFilterLabel = (): string => {
    switch (timeFilter) {
      case "week":
        return "Última Semana";
      case "month":
        return "Último Mes";
      case "year":
        return "Último Año";
      default:
        return "Período Seleccionado";
    }
  };

  // Format date range for PDF
  const formatDateRange = (): string => {
    if (!dateRange) return "";
    try {
      const start = new Date(dateRange.timeMin);
      const end = new Date(dateRange.timeMax);
      return `${start.toLocaleDateString("es-ES")} - ${end.toLocaleDateString(
        "es-ES"
      )}`;
    } catch {
      return "";
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (tableData.length === 0) {
      message.warning("No hay datos para exportar");
      return;
    }

    try {
      const doc = new jsPDF("l", "mm", "a4"); // landscape orientation

      // Title
      doc.setFontSize(18);
      doc.text("Reporte de Eventos de Calendario", 14, 15);

      // Filter information
      doc.setFontSize(10);
      let yPosition = 25;

      // Time filter
      doc.text(`Período: ${getFilterLabel()}`, 14, yPosition);
      yPosition += 5;

      // Date range
      const dateRangeText = formatDateRange();
      if (dateRangeText) {
        doc.text(`Rango de fechas: ${dateRangeText}`, 14, yPosition);
        yPosition += 5;
      }

      // Client filter
      if (selectedClients.length > 0) {
        doc.text(
          `Clientes filtrados: ${selectedClients.join(", ")}`,
          14,
          yPosition
        );
        yPosition += 5;
      } else {
        doc.text("Clientes filtrados: Todos", 14, yPosition);
        yPosition += 5;
      }

      // Total hours
      doc.text(
        `Total trabajado: ${formatTotalHours(totalHours)}`,
        14,
        yPosition
      );
      yPosition += 8;

      // Prepare table data
      const tableRows = tableData.map((event) => [
        event.dateFormatted,
        event.endTime
          ? `${event.startTime} - ${event.endTime}`
          : event.startTime,
        event.summary,
        event.duration ? formatDurationForPDF(event.duration) : "-",
      ]);

      // Add table
      autoTable(doc, {
        head: [["Fecha", "Hora", "Evento", "Duración"]],
        body: tableRows,
        startY: yPosition,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 40 }, // Fecha
          1: { cellWidth: 40 }, // Hora
          2: { cellWidth: "auto" }, // Evento
          3: { cellWidth: 30 }, // Duración
        },
        margin: { left: 14, right: 14 },
      });

      // Generate filename
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const clientStr =
        selectedClients.length > 0
          ? `_${selectedClients.join("-").substring(0, 20)}`
          : "";
      const filename = `eventos_${dateStr}${clientStr}.pdf`;

      // Save PDF
      doc.save(filename);
      message.success("PDF exportado correctamente");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      message.error("Error al exportar PDF");
    }
  };

  const columns: ColumnsType<TableEvent> = [
    {
      title: "Fecha",
      dataIndex: "dateFormatted",
      key: "date",
      sorter: (a, b) => a.date.localeCompare(b.date),
      width: 200,
    },
    {
      title: "Hora",
      key: "time",
      render: (_, record) => (
        <span>
          {record.startTime}
          {record.endTime && ` - ${record.endTime}`}
        </span>
      ),
      width: 150,
    },
    {
      title: "Evento",
      dataIndex: "summary",
      key: "summary",
    },
    {
      title: "Duración",
      key: "duration",
      render: (_, record) =>
        record.duration ? (
          <span>
            {record.duration.hours}h {record.duration.minutes}m{" "}
            {record.duration.seconds}s
          </span>
        ) : (
          <Text type="secondary">-</Text>
        ),
      width: 120,
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Title level={3} className="mb-4">
        <CalendarOutlined className="mr-2" />
        Próximos Eventos
      </Title>
      {allEvents.length > 0 ? (
        <>
          <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Select
                mode="multiple"
                placeholder="Filtrar por cliente"
                allowClear
                style={{ width: 300 }}
                value={selectedClients}
                onChange={(value) => setSelectedClients(value)}
                options={clients.map((client) => ({
                  label: client,
                  value: client,
                }))}
              />
              {tableData.length > 0 && (
                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  onClick={handleExportPDF}
                >
                  Exportar PDF
                </Button>
              )}
            </div>
            <div>
              <Text strong className="text-lg">
                Total trabajado: {formatTotalHours(totalHours)}
              </Text>
            </div>
          </div>
          {tableData.length > 0 ? (
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={{ pageSize: 20 }}
              scroll={{ x: 800 }}
            />
          ) : (
            <Card>
              <Text>No hay eventos para el cliente seleccionado</Text>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <Text>No hay eventos próximos</Text>
        </Card>
      )}
    </div>
  );
}
