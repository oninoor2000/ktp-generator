import * as React from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Combobox,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "~/components/ui/combobox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "~/components/ui/field";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { ProvinceRow } from "~/utils/regions";

interface ProvinceMultiSelectProps {
  provinces: ProvinceRow[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  loading?: boolean;
  loadError?: boolean;
  onRetry?: () => void;
}

export function ProvinceMultiSelect({
  provinces,
  value,
  onChange,
  error,
  loading,
  loadError,
  onRetry,
}: ProvinceMultiSelectProps) {
  const anchorRef = useComboboxAnchor();
  const selected = React.useMemo(
    () => provinces.filter((province) => value.includes(province.id)),
    [provinces, value],
  );
  const provinceIds = React.useMemo(
    () => provinces.map((province) => province.id),
    [provinces],
  );
  const nameById = React.useMemo(
    () => new Map(provinces.map((province) => [province.id, province.name])),
    [provinces],
  );

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="province-picker">Provinsi</FieldLabel>
      <FieldContent>
        {loadError ? (
          <div className="flex flex-col gap-3 border border-border p-3">
            <p className="text-sm text-muted-foreground">
              Daftar provinsi tidak dapat dimuat.
            </p>
            <Button type="button" size="sm" onClick={onRetry}>
              Coba Lagi
            </Button>
          </div>
        ) : (
          <Combobox
            items={provinceIds}
            multiple
            value={value}
            onValueChange={(nextValue) => onChange(nextValue)}
            itemToStringValue={(provinceId) => nameById.get(provinceId) ?? provinceId}
            disabled={loading}
          >
            <div ref={anchorRef} className="w-full">
              <ComboboxChips aria-invalid={Boolean(error)} className="w-full">
                <ComboboxValue>
                  {selected.slice(0, 3).map((province) => (
                    <ComboboxChip key={province.id}>{province.name}</ComboboxChip>
                  ))}
                  {selected.length > 3 ? (
                    <Badge variant="secondary">+{selected.length - 3}</Badge>
                  ) : null}
                </ComboboxValue>
                <ComboboxChipsInput
                  id="province-picker"
                  placeholder={loading ? "Memuat provinsi..." : "Cari provinsi"}
                />
              </ComboboxChips>
            </div>
            <ComboboxContent anchor={anchorRef}>
              <div className="flex items-center justify-between gap-2 px-1.5 pt-1.5">
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => onChange(provinceIds)}
                >
                  Pilih Semua
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => onChange([])}
                >
                  Hapus
                </Button>
              </div>
              <ComboboxEmpty>Provinsi tidak ditemukan.</ComboboxEmpty>
              <ScrollArea className="max-h-72">
                <ComboboxList>
                  {(provinceId) => (
                    <ComboboxItem key={provinceId} value={provinceId}>
                      {nameById.get(provinceId) ?? provinceId}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ScrollArea>
            </ComboboxContent>
          </Combobox>
        )}
        <div className="flex flex-wrap gap-2">
          {selected.slice(0, 3).map((province) => (
            <Badge key={province.id} variant="secondary">
              {province.name}
            </Badge>
          ))}
          {selected.length > 3 ? (
            <Badge variant="secondary">+{selected.length - 3}</Badge>
          ) : null}
        </div>
        <FieldDescription>
          Pilih satu atau beberapa provinsi untuk sumber data wilayah acak.
        </FieldDescription>
        <FieldError>{error}</FieldError>
      </FieldContent>
    </Field>
  );
}
