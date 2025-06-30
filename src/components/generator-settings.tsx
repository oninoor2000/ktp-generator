import { useContext, useEffect, type Dispatch } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type {
  GeneratorSettingsType,
  GeneratorSettingsActionType,
  CardType,
} from "@/lib/types";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import {
  GeneratorSettingsContext,
  GeneratorSettingsDispatchContext,
} from "@/context/generator-settings-context";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { EnhancedProvinceMultiSelect } from "./enhanced-province-multi-select";
import {
  generatorFormSchema,
  type GeneratorFormSchemaType,
} from "@/lib/schema";
import {
  Baby,
  CreditCard,
  Loader2,
  Settings,
  User,
  Users,
  VenusAndMars,
} from "lucide-react";
import { Button } from "./ui/button";
// import { DataGenerationStatus } from "./data-generation-status";

interface Props {
  cardType: CardType;
  isGenerating: boolean;
}

export function GeneratorSettings({ cardType, isGenerating }: Props) {
  const config = useContext(GeneratorSettingsContext) as GeneratorSettingsType;
  const dispatch = useContext(
    GeneratorSettingsDispatchContext,
  ) as Dispatch<GeneratorSettingsActionType>;

  const form = useForm<GeneratorFormSchemaType>({
    resolver: zodResolver(generatorFormSchema),
    defaultValues: config,
  });

  function onSubmit(data: GeneratorFormSchemaType) {
    if (data.province.length === 0) {
      form.setError("province", {
        message: "Province must be selected",
      });
      return;
    }

    if (cardType === "KTA" && data.maxAge > 16) {
      form.setError("maxAge", {
        message: "Usia maksimum untuk KTA berakhir pada 16 tahun",
      });
      return;
    }

    if (cardType === "KTA" && data.minAge > 16) {
      form.setError("minAge", {
        message: "Usia minimum untuk KTA berakhir pada 16 tahun",
      });
      return;
    }

    dispatch({
      type: "CHANGE_SETTINGS",
      payload: data,
    });
    dispatch({
      type: "GENERATE_DATA",
      payload: data,
    });
  }

  // Watch form
  const dataCount = form.watch("dataCount");
  const minAge = form.watch("minAge");
  const maxAge = form.watch("maxAge");
  const gender = form.watch("gender");
  const province = form.watch("province");

  useEffect(() => {
    dispatch({
      type: "CHANGE_SETTINGS",
      payload: {
        dataCount: Number(dataCount),
        minAge: Number(minAge),
        maxAge: Number(maxAge),
        gender,
        province, // Remove .toUpperCase() conversion
      },
    });
  }, [dataCount, minAge, maxAge, gender, province, dispatch, cardType, form]);

  return (
    <Card className="p-5">
      <CardContent className="p-0">
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "rounded-xl bg-gradient-to-r p-3",
                cardType === "KTP" && "from-cyan-500 to-blue-600",
                cardType === "KTA" && "from-pink-500 to-red-500",
              )}
            >
              {cardType === "KTP" && (
                <CreditCard className="h-6 w-6 text-white" />
              )}
              {cardType === "KTA" && <Baby className="h-6 w-6 text-white" />}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">
                Generator Data {cardType === "KTP" ? "KTP" : "KTA"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {cardType === "KTP"
                  ? "Kartu Tanda Penduduk untuk warga negara Indonesia"
                  : "Kartu Tanda Penduduk untuk anak-anak warga negara Indonesia"}
              </p>
            </div>
          </div>
          {/* <div className="flex justify-end">
            <DataGenerationStatus />
          </div> */}
        </div>

        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Data Count */}
              <FormField
                control={form.control}
                name="dataCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Settings className="h-4 w-4" /> Jumlah Data{" "}
                      {cardType === "KTP" ? "KTP" : "KTA"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        {...field}
                        className="w-full"
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                        }}
                        disabled={isGenerating}
                      />
                    </FormControl>
                    <FormDescription>Maksimal 1000 data</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Age */}
              <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="minAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <User className="h-4 w-4" /> Usia Minimum
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={cardType === "KTP" ? 17 : 1}
                          max={cardType === "KTP" ? 100 : 16}
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                          }}
                          className="w-full"
                          disabled={isGenerating}
                        />
                      </FormControl>
                      <FormDescription>
                        Usia minimum {cardType === "KTP" ? "17" : "1"} tahun
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Users className="h-4 w-4" /> Usia Maksimum
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={cardType === "KTP" ? 17 : 1}
                          max={cardType === "KTP" ? undefined : 16}
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                          }}
                          className="w-full"
                          disabled={isGenerating}
                        />
                      </FormControl>
                      {cardType === "KTA" && (
                        <FormDescription>
                          Usia maksimum 16 tahun
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Gender */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <VenusAndMars className="h-4 w-4" /> Jenis Kelamin
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isGenerating}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder="Pilih Jenis Kelamin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Jenis Kelamin</SelectLabel>
                          <SelectItem value="MALE" className="cursor-pointer">
                            Laki-laki
                          </SelectItem>
                          <SelectItem value="FEMALE" className="cursor-pointer">
                            Perempuan
                          </SelectItem>
                          <SelectItem value="BOTH" className="cursor-pointer">
                            Laki-laki dan Perempuan
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Province */}
              <EnhancedProvinceMultiSelect
                form={form}
                isGenerating={isGenerating}
              />

              <Button
                className={cn(
                  "w-full cursor-pointer bg-gradient-to-r text-white transition-colors duration-400",
                  isGenerating && "flex items-center justify-center gap-2",
                  cardType === "KTP" &&
                    "from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-cyan-500",
                  cardType === "KTA" &&
                    "from-pink-500 to-red-500 hover:from-red-500 hover:to-pink-500",
                )}
                size="lg"
                disabled={isGenerating}
                type="submit"
                onClick={async () => {
                  // Trigger validation first
                  const isValid = await form.trigger();

                  if (isValid) {
                    form.handleSubmit(onSubmit)();
                  }
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-2 w-2 animate-spin text-white" />
                    <span>Memuat data...</span>
                  </>
                ) : (
                  "Generate Data"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
