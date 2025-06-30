import { useCallback, useState, useEffect } from "react";

import type { UseFormReturn } from "react-hook-form";
import type { GeneratorFormSchemaType } from "@/lib/schema";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { ChevronsUpDown, Globe2Icon, X, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { getProvinces } from "@/service/data-generation-service";

interface Props {
  form: UseFormReturn<GeneratorFormSchemaType>;
  isGenerating: boolean;
}

export function EnhancedProvinceMultiSelect({ form, isGenerating }: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [provinces, setProvinces] = useState<{ name: string; id: string }[]>(
    [],
  );
  const [isLoadingProvinces, setIsLoadingProvinces] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProvinces = form.watch("province") || [];

  // Load provinces when component mounts
  useEffect(() => {
    const loadProvinces = async () => {
      setIsLoadingProvinces(true);
      setError(null);

      try {
        const provincesData = await getProvinces();
        setProvinces(provincesData);

        // If no provinces are selected yet, default to DKI Jakarta
        if (selectedProvinces.length === 0) {
          const jakarta = provincesData.find(
            (p: { name: string; id: string }) => p.name === "DKI JAKARTA",
          );
          if (jakarta) {
            form.setValue("province", [jakarta.name], { shouldValidate: true });
          }
        }
      } catch (err) {
        console.error("Error loading provinces:", err);
        setError("Gagal memuat data provinsi. Menggunakan data fallback.");

        // Use fallback provinces
        const fallbackProvinces: { name: string; id: string }[] = [
          { id: "31", name: "DKI JAKARTA" },
          { id: "32", name: "JAWA BARAT" },
          { id: "33", name: "JAWA TENGAH" },
          { id: "35", name: "JAWA TIMUR" },
        ];
        setProvinces(fallbackProvinces);

        if (selectedProvinces.length === 0) {
          form.setValue("province", ["DKI JAKARTA"], { shouldValidate: true });
        }
      } finally {
        setIsLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, [form, selectedProvinces.length]);

  const handleProvinceToggle = useCallback(
    (provinceName: string) => {
      const currentProvinces = form.getValues("province") || [];
      const isSelected = currentProvinces.includes(provinceName);

      if (isSelected) {
        // Remove province
        const updatedProvinces = currentProvinces.filter(
          (p) => p !== provinceName,
        );
        form.setValue("province", updatedProvinces, { shouldValidate: true });
      } else {
        // Add province
        const updatedProvinces = [...currentProvinces, provinceName];
        form.setValue("province", updatedProvinces, { shouldValidate: true });
      }
    },
    [form],
  );

  const removeProvince = useCallback(
    (provinceName: string) => {
      const currentProvinces = form.getValues("province") || [];
      const updatedProvinces = currentProvinces.filter(
        (p) => p !== provinceName,
      );
      form.setValue("province", updatedProvinces, { shouldValidate: true });
    },
    [form],
  );

  const selectAllProvinces = useCallback(() => {
    const allProvinceNames = provinces.map((p) => p.name);
    form.setValue("province", allProvinceNames, { shouldValidate: true });
  }, [form, provinces]);

  const deselectAllProvinces = useCallback(() => {
    form.setValue("province", [], { shouldValidate: true });
  }, [form]);

  return (
    <FormField
      control={form.control}
      name="province"
      render={() => (
        <FormItem className="flex flex-col">
          <FormLabel className="flex items-center gap-1">
            <Globe2Icon className="h-4 w-4" /> Provinsi
          </FormLabel>

          {error && (
            <FormDescription className="text-amber-600">
              {error}
            </FormDescription>
          )}

          {/* Display selected provinces */}
          {selectedProvinces.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {selectedProvinces.slice(0, 2).map((province) => (
                <Badge
                  key={province}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {province}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="hover:bg-destructive group flex !h-3 !w-3 cursor-pointer items-center justify-center rounded-full !p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProvince(province);
                    }}
                    disabled={isGenerating}
                  >
                    <X className="!h-2.5 !w-2.5 group-hover:text-white" />
                  </Button>
                </Badge>
              ))}

              {selectedProvinces.length > 2 && (
                <Badge variant="secondary">
                  +{selectedProvinces.length - 2} lainnya
                </Badge>
              )}
            </div>
          )}

          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={isOpen}
                  className={cn(
                    "w-full cursor-pointer justify-between font-normal",
                    selectedProvinces.length === 0 && "text-muted-foreground",
                  )}
                  disabled={isGenerating || isLoadingProvinces}
                >
                  {isLoadingProvinces ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memuat provinsi...
                    </div>
                  ) : selectedProvinces.length === 0 ? (
                    "Pilih provinsi"
                  ) : selectedProvinces.length === 1 ? (
                    selectedProvinces[0]
                  ) : (
                    `${selectedProvinces.length} provinsi dipilih`
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Cari provinsi..." className="h-9" />
                <CommandList>
                  <CommandEmpty>
                    {isLoadingProvinces
                      ? "Memuat data provinsi..."
                      : "Tidak ada provinsi yang ditemukan."}
                  </CommandEmpty>
                  <CommandGroup>
                    {!isLoadingProvinces && (
                      <>
                        {/* Bulk actions */}
                        <div className="flex gap-2 border-b p-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectAllProvinces();
                              setIsOpen(false);
                            }}
                            className="h-7 cursor-pointer border-blue-600/20 bg-blue-600/10 text-xs text-blue-600 hover:bg-blue-600/20 hover:text-blue-600"
                          >
                            Pilih Semua ({provinces.length})
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deselectAllProvinces();
                              setIsOpen(false);
                            }}
                            className="h-7 cursor-pointer border-transparent text-xs shadow-none hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
                          >
                            Hapus Semua
                          </Button>
                        </div>

                        {provinces.map((province) => {
                          const isSelected = selectedProvinces.includes(
                            province.name,
                          );
                          return (
                            <CommandItem
                              value={province.name}
                              key={province.id}
                              onSelect={() =>
                                handleProvinceToggle(province.name)
                              }
                              className="cursor-pointer"
                            >
                              <div className="flex w-full items-center justify-between space-x-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox checked={isSelected} />
                                  <span>{province.name}</span>
                                </div>
                                <span className="text-muted-foreground text-xs">
                                  {province.id}
                                </span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </>
                    )}

                    {isLoadingProvinces && (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Memuat data provinsi...</span>
                      </div>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <FormDescription>
            Data provinsi diambil dari database MySQL lokal untuk akurasi dan
            performa yang lebih baik. Total {provinces.length} provinsi
            tersedia.
          </FormDescription>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
