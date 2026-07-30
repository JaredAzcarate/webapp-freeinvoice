"use client";

import { Button, Form, Input, InputNumber, Select, Space, message } from "antd";
import { useEffect, useMemo } from "react";

interface BillingSettingsFormValues {
  hourlyRate: number | null;
  digestEmail: string | null;
  excludedProjects: string[];
}

interface BillingSettingsFormProps {
  hourlyRate: number | null;
  digestEmail: string | null;
  excludedProjects: string[];
  projectOptions: string[];
  isLoading?: boolean;
  isLoadingProjects?: boolean;
  isSaving: boolean;
  onSave: (values: {
    hourlyRate: number | null;
    digestEmail: string | null;
    excludedProjects: string[];
  }) => Promise<void>;
}

/**
 * Pure UI form for hourly rate, digest email, and excluded digest projects
 */
export default function BillingSettingsForm({
  hourlyRate,
  digestEmail,
  excludedProjects,
  projectOptions,
  isLoading = false,
  isLoadingProjects = false,
  isSaving,
  onSave,
}: BillingSettingsFormProps) {
  const [form] = Form.useForm<BillingSettingsFormValues>();

  useEffect(() => {
    form.setFieldsValue({
      hourlyRate,
      digestEmail: digestEmail ?? "",
      excludedProjects,
    });
  }, [form, hourlyRate, digestEmail, excludedProjects]);

  const selectOptions = useMemo(() => {
    const merged = new Set<string>([...projectOptions, ...excludedProjects]);
    const withoutSinProyecto = Array.from(merged)
      .filter((p) => p !== "Sin proyecto")
      .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

    if (merged.has("Sin proyecto") || projectOptions.includes("Sin proyecto")) {
      withoutSinProyecto.push("Sin proyecto");
    }

    return withoutSinProyecto.map((value) => ({ label: value, value }));
  }, [projectOptions, excludedProjects]);

  const onFinish = async (values: BillingSettingsFormValues) => {
    try {
      const rawEmail =
        typeof values.digestEmail === "string" ? values.digestEmail.trim() : "";
      const rawRate = values.hourlyRate as unknown;
      let hourlyRate: number | null = null;

      if (rawRate !== null && rawRate !== undefined && rawRate !== "") {
        const parsed = Number(rawRate);
        if (!Number.isFinite(parsed)) {
          message.error("Introduce un número válido");
          return;
        }
        hourlyRate = parsed;
      }

      await onSave({
        hourlyRate,
        digestEmail: rawEmail === "" ? null : rawEmail,
        excludedProjects: values.excludedProjects ?? [],
      });
      message.success("Configuración de facturación actualizada correctamente");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al actualizar la configuración de facturación";
      message.error(errorMessage);
    }
  };

  return (
    <Form
      form={form}
      name="billingSettings"
      onFinish={onFinish}
      layout="vertical"
      autoComplete="off"
      disabled={isLoading || isSaving}
      initialValues={{
        hourlyRate,
        digestEmail: digestEmail ?? "",
        excludedProjects,
      }}
    >
      <Form.Item
        label="Tarifa horaria"
        extra="Se usa para el resumen semanal de facturación. Déjalo vacío para borrarla."
      >
        <Space.Compact className="w-full">
          <Form.Item
            name="hourlyRate"
            noStyle
            rules={[
              {
                validator: (_, value) => {
                  if (value === null || value === undefined || value === "") {
                    return Promise.resolve();
                  }
                  const numeric =
                    typeof value === "number" ? value : Number(value);
                  if (!Number.isFinite(numeric)) {
                    return Promise.reject(
                      new Error("Introduce un número válido")
                    );
                  }
                  if (numeric <= 0) {
                    return Promise.reject(
                      new Error("La tarifa debe ser mayor que 0")
                    );
                  }
                  if (numeric > 999999.99) {
                    return Promise.reject(
                      new Error("La tarifa no puede superar 999999.99")
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              className="w-full"
              min={0.01}
              max={999999.99}
              step={0.01}
              precision={2}
              placeholder="Ej. 45.00"
            />
          </Form.Item>
          <Button disabled>€/h</Button>
        </Space.Compact>
      </Form.Item>

      <Form.Item
        label="Correo del resumen semanal"
        name="digestEmail"
        rules={[
          {
            type: "email",
            message: "Introduce un correo válido",
          },
        ]}
        extra="Si está vacío, se usa el email de la cuenta."
      >
        <Input type="email" placeholder="Ej. facturacion@empresa.com" allowClear />
      </Form.Item>

      <Form.Item
        label="Proyectos excluidos del resumen"
        name="excludedProjects"
        extra="Estos proyectos no se incluyen en el correo semanal."
      >
        <Select
          mode="multiple"
          allowClear
          showSearch
          placeholder="Selecciona proyectos a excluir"
          options={selectOptions}
          loading={isLoadingProjects}
          optionFilterProp="label"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isSaving}>
          Guardar
        </Button>
      </Form.Item>
    </Form>
  );
}
