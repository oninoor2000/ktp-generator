"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { PlayIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";
import { generatorSettingsSchema } from "~/features/generator/domain/schemas";
import type { CardType, GeneratorSettings } from "~/features/generator/domain/types";
import { ProvinceMultiSelect } from "~/features/generator/components/province-multi-select";
import type { ProvinceRow } from "~/utils/regions";

interface GeneratorFormProps {
  cardType: CardType;
  initialValues: GeneratorSettings;
  provinces: ProvinceRow[];
  provincesLoading?: boolean;
  provincesError?: boolean;
  onRetryProvinces?: () => void;
  pending?: boolean;
  onSubmit: (value: GeneratorSettings) => Promise<void> | void;
  onValuesChange?: (value: GeneratorSettings) => void;
}

export function GeneratorForm({
  cardType,
  initialValues,
  provinces,
  provincesLoading,
  provincesError,
  onRetryProvinces,
  pending,
  onSubmit,
  onValuesChange,
}: GeneratorFormProps) {
  const fieldRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const [submitErrors, setSubmitErrors] = React.useState<Record<string, string>>({});

  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      const result = generatorSettingsSchema.safeParse(value);
      if (!result.success) {
        const nextErrors = Object.fromEntries(
          result.error.issues.map((issue) => [
            String(issue.path[0] ?? "form"),
            issue.message,
          ]),
        ) as Record<string, string>;
        setSubmitErrors(nextErrors);
        const firstInvalid = result.error.issues[0]?.path[0];
        if (firstInvalid) {
          fieldRefs.current[String(firstInvalid)]?.focus();
        }
        return;
      }

      setSubmitErrors({});
      await onSubmit(result.data);
    },
  });

  React.useEffect(() => {
    onValuesChange?.(form.state.values as GeneratorSettings);
  }, [form.state.values, onValuesChange]);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="dataCount">
          {(field) => (
            <Field data-invalid={Boolean(submitErrors.dataCount)}>
              <FieldLabel htmlFor={field.name}>Jumlah Data</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  ref={(node) => {
                    fieldRefs.current.dataCount = node;
                  }}
                  type="number"
                  min={1}
                  max={1000}
                  value={field.state.value}
                  aria-invalid={Boolean(submitErrors.dataCount)}
                  onChange={(event) => field.handleChange(Number(event.target.value))}
                />
                <FieldDescription>Maksimum 1000 data per permintaan.</FieldDescription>
                <FieldError>{submitErrors.dataCount}</FieldError>
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="minAge">
            {(field) => (
              <Field data-invalid={Boolean(submitErrors.minAge)}>
                <FieldLabel htmlFor={field.name}>Usia Minimum</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    ref={(node) => {
                      fieldRefs.current.minAge = node;
                    }}
                    type="number"
                    min={cardType === "KTP" ? 17 : 1}
                    max={100}
                    value={field.state.value}
                    aria-invalid={Boolean(submitErrors.minAge)}
                    onChange={(event) => field.handleChange(Number(event.target.value))}
                  />
                  <FieldError>{submitErrors.minAge}</FieldError>
                </FieldContent>
              </Field>
            )}
          </form.Field>

          <form.Field name="maxAge">
            {(field) => (
              <Field data-invalid={Boolean(submitErrors.maxAge)}>
                <FieldLabel htmlFor={field.name}>Usia Maksimum</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    ref={(node) => {
                      fieldRefs.current.maxAge = node;
                    }}
                    type="number"
                    min={1}
                    max={100}
                    value={field.state.value}
                    aria-invalid={Boolean(submitErrors.maxAge)}
                    onChange={(event) => field.handleChange(Number(event.target.value))}
                  />
                  <FieldError>{submitErrors.maxAge}</FieldError>
                </FieldContent>
              </Field>
            )}
          </form.Field>
        </div>

        <form.Field name="gender">
          {(field) => (
            <Field data-invalid={Boolean(submitErrors.gender)}>
              <FieldLabel>Jenis Kelamin</FieldLabel>
              <FieldContent>
                <div className="grid grid-cols-3 gap-0">
                  {[
                    ["MALE", "Laki-laki"],
                    ["FEMALE", "Perempuan"],
                    ["BOTH", "Keduanya"],
                  ].map(([value, label]) => (
                    <Button
                      key={value}
                      type="button"
                      variant={field.state.value === value ? "secondary" : "outline"}
                      className={cn("rounded-none", field.state.value === value && "relative z-10")}
                      onClick={() =>
                        field.handleChange(value as GeneratorSettings["gender"])
                      }
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <FieldError>{submitErrors.gender}</FieldError>
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="provinceIds">
          {(field) => (
            <ProvinceMultiSelect
              provinces={provinces}
              value={field.state.value}
              onChange={(value) => field.handleChange(value)}
              error={submitErrors.provinceIds}
              loading={provincesLoading}
              loadError={provincesError}
              onRetry={onRetryProvinces}
            />
          )}
        </form.Field>

        <form.Field name="honeypot">
          {(field) => (
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
              value={field.state.value ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          )}
        </form.Field>

        <form.Field name="clientStartedAt">
          {(field) => (
            <input
              type="hidden"
              value={field.state.value ?? Date.now()}
              onChange={(event) => field.handleChange(Number(event.target.value))}
            />
          )}
        </form.Field>
      </FieldGroup>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Spinner data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
        {pending ? "Sedang membuat..." : `Buat ${cardType}`}
      </Button>
    </form>
  );
}
