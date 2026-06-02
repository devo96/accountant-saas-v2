"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useState } from "react";

type Field = {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "date" | "email";
  required?: boolean;
  options?: { value: string; label: string }[];
};

type AutoFormProps = {
  fields: Field[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  defaultValues?: Record<string, string>;
};

export function AutoForm({ fields, onSubmit, submitLabel = "Submit", loading, defaultValues }: AutoFormProps) {
  const [values, setValues] = useState<Record<string, string>>(defaultValues ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    for (const f of fields) {
      if (f.required && !values[f.name]) {
        newErrors[f.name] = `${f.label} is required`;
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((f) =>
        f.type === "select" ? (
          <Select
            key={f.name}
            id={f.name}
            label={f.label}
            options={f.options ?? []}
            placeholder={`Select ${f.label}`}
            error={errors[f.name]}
            value={values[f.name] ?? ""}
            onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
            required={f.required}
          />
        ) : (
          <Input
            key={f.name}
            id={f.name}
            label={f.label}
            type={f.type}
            error={errors[f.name]}
            value={values[f.name] ?? ""}
            onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
            required={f.required}
          />
        )
      )}
      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}
