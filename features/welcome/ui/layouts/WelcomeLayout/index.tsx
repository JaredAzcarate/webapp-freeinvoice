"use client";

import CalendarExample from "@/features/welcome/ui/components/CalendarExample";
import type { TimeFilterType } from "@/features/welcome/ui/components/CalendarExample/types";
import { useEventsByGoogle } from "@/shared/hooks/useEventsByGoogle";
import {
  getCustomDateRange,
  getDateRangeFromMonthKey,
  getLastMonthRange,
  getLastWeekRange,
  getLastYearRange,
  getYearMonthsUpToToday,
} from "@/shared/utils/dates";
import type { MenuProps } from "antd";
import { Avatar, Button, Card, DatePicker, Dropdown, Select, Spin, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/es";
import { DateTime } from "luxon";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const { Text } = Typography;
const { RangePicker } = DatePicker;

type PresetFilterType = "week" | "month" | "year";

type ActiveFilter =
  | { type: "preset"; value: PresetFilterType }
  | { type: "yearMonth"; monthKey: string }
  | { type: "custom"; start: Dayjs; end: Dayjs };

dayjs.locale("es");

export default function WelcomeLayout() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const timeZone = "Europe/Madrid";
  const monthOptions = useMemo(() => getYearMonthsUpToToday(timeZone), [timeZone]);

  const [activeFilter, setActiveFilter] = useState<ActiveFilter>({
    type: "preset",
    value: "week",
  });

  const { dateRange, timeFilter, timeFilterLabel } = useMemo(() => {
    if (activeFilter.type === "preset") {
      const preset = activeFilter.value;
      const ranges = {
        week: getLastWeekRange(timeZone),
        month: getLastMonthRange(timeZone),
        year: getLastYearRange(timeZone),
      } as const;
      const labels = {
        week: "Última Semana",
        month: "Último Mes",
        year: "Último Año",
      } as const;

      return {
        dateRange: ranges[preset],
        timeFilter: preset as TimeFilterType,
        timeFilterLabel: labels[preset],
      };
    }

    if (activeFilter.type === "yearMonth") {
      const monthLabel =
        monthOptions.find((option) => option.value === activeFilter.monthKey)
          ?.label ?? activeFilter.monthKey;

      return {
        dateRange: getDateRangeFromMonthKey(activeFilter.monthKey, timeZone),
        timeFilter: "yearMonth" as TimeFilterType,
        timeFilterLabel: monthLabel,
      };
    }

    const start = DateTime.fromJSDate(activeFilter.start.toDate()).setZone(timeZone);
    const end = DateTime.fromJSDate(activeFilter.end.toDate()).setZone(timeZone);

    return {
      dateRange: getCustomDateRange(start, end, timeZone),
      timeFilter: "custom" as TimeFilterType,
      timeFilterLabel: "Rango personalizado",
    };
  }, [activeFilter, monthOptions, timeZone]);

  const {
    eventsByDay,
    isLoading: isLoadingEvents,
    isError,
  } = useEventsByGoogle({
    timeMin: dateRange.timeMin,
    timeMax: dateRange.timeMax,
    maxResults: 2500,
    timeZone,
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
        <div className="mb-6 flex w-full max-w-4xl flex-col gap-4">
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type={
                activeFilter.type === "preset" && activeFilter.value === "week"
                  ? "primary"
                  : "default"
              }
              onClick={() => setActiveFilter({ type: "preset", value: "week" })}
            >
              Última Semana
            </Button>
            <Button
              type={
                activeFilter.type === "preset" && activeFilter.value === "month"
                  ? "primary"
                  : "default"
              }
              onClick={() => setActiveFilter({ type: "preset", value: "month" })}
            >
              Último Mes
            </Button>
            <Button
              type={
                activeFilter.type === "preset" && activeFilter.value === "year"
                  ? "primary"
                  : "default"
              }
              onClick={() => setActiveFilter({ type: "preset", value: "year" })}
            >
              Último Año
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Select
              style={{ minWidth: 220 }}
              placeholder="Mes del año"
              value={
                activeFilter.type === "yearMonth"
                  ? activeFilter.monthKey
                  : undefined
              }
              options={monthOptions}
              onChange={(monthKey) =>
                setActiveFilter({ type: "yearMonth", monthKey })
              }
            />
            <RangePicker
              format="DD/MM/YYYY"
              placeholder={["Desde", "Hasta"]}
              value={
                activeFilter.type === "custom"
                  ? [activeFilter.start, activeFilter.end]
                  : null
              }
              disabledDate={(current) =>
                current ? current.endOf("day").isAfter(dayjs().endOf("day")) : false
              }
              onChange={(dates) => {
                if (!dates?.[0] || !dates[1]) {
                  return;
                }
                setActiveFilter({
                  type: "custom",
                  start: dates[0],
                  end: dates[1],
                });
              }}
            />
          </div>
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
          <CalendarExample
            eventsByDay={eventsByDay}
            timeFilter={timeFilter}
            timeFilterLabel={timeFilterLabel}
            dateRange={dateRange}
          />
        )}
      </div>
    </div>
  );
}
