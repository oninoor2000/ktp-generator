"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { ModeToggle } from "~/components/mode-toggle";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useGenerateCardData } from "~/features/generator/hooks/use-generate-card-data";
import { useGeneratorPreferences } from "~/features/generator/hooks/use-generator-preferences";
import { GeneratorForm } from "~/features/generator/components/generator-form";
import { ChallengePanel } from "~/features/generator/components/challenge-panel";
import { DataPreview } from "~/features/generator/components/data-preview";
import type { CardType, GeneratedRow, GeneratorSettings } from "~/features/generator/domain/types";
import { fetchProvinces } from "~/server/regions";
import type { CsvUploadResult } from "./csv-upload";

const COPY = {
  KTP: {
    title: "KTP",
    subtitle: "Buat data KTP dummy untuk pengujian dan pengembangan.",
    formTitle: "Generator Data KTP",
    formDescription:
      "Atur batch data lalu hasilkan identitas Indonesia palsu untuk kebutuhan pengujian.",
  },
  KTA: {
    title: "KTA",
    subtitle: "Buat data KTA anak dummy untuk pengujian dan pengembangan.",
    formTitle: "Generator Data KTA",
    formDescription:
      "Atur batch data lalu hasilkan identitas anak palsu untuk kebutuhan pengujian.",
  },
} as const;

export function GeneratorPage({ cardType }: { cardType: CardType }) {
  const copy = COPY[cardType];
  const { settings, setSettings } = useGeneratorPreferences(cardType);
  const provinceQuery = useQuery({
    queryKey: ["provinces"],
    queryFn: () => fetchProvinces(),
  });
  const mutation = useGenerateCardData();
  const [rows, setRows] = React.useState<GeneratedRow[]>([]);
  const [challenge, setChallenge] = React.useState<{
    retryAfterSeconds?: number;
  } | null>(null);

  // Auto-select Jakarta (or first province) when provinces load and no province
  // is selected yet.
  React.useEffect(() => {
    if (!provinceQuery.data?.length || settings.provinceIds.length > 0) {
      return;
    }

    const jakarta = provinceQuery.data.find((province) =>
      /jakarta/i.test(province.name),
    );
    const first = jakarta ?? provinceQuery.data[0];
    if (!first) return;

    setSettings((current) => ({
      ...current,
      provinceIds: [first.id],
    }));
  }, [provinceQuery.data, setSettings, settings.provinceIds.length]);

  async function handleSubmit(value: GeneratorSettings) {
    const response = await mutation.mutateAsync({ data: value });
    if (!response.ok) {
      setRows([]);
      setChallenge({ retryAfterSeconds: response.retryAfterSeconds });
      return;
    }

    setChallenge(null);
    setRows(response.data);
  }

  function handleImport(result: CsvUploadResult) {
    setChallenge(null);
    setRows(result.rows);
  }

  function handleClear() {
    setRows([]);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-xl font-semibold uppercase">KTP Lab</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              {copy.subtitle} Data bersifat palsu dan hanya untuk testing,
              development, dan mockup.
            </p>
            <p className="text-xs text-muted-foreground">
              Referensi wilayah dari{" "}
              <a
                href="https://github.com/cahyadsn/wilayah"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline underline-offset-4"
              >
                cahyadsn/wilayah
              </a>
              .
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              render={<Link to="/" />}
              variant={cardType === "KTP" ? "secondary" : "ghost"}
            >
              KTP
            </Button>
            <Button
              render={<Link to="/kta" />}
              variant={cardType === "KTA" ? "secondary" : "ghost"}
            >
              KTA
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[420px_minmax(0,1fr)] lg:px-8">
        {/* Left column — generator form */}
        <Card>
          <CardHeader>
            <CardTitle>{copy.formTitle}</CardTitle>
            <CardDescription>{copy.formDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <GeneratorForm
              cardType={cardType}
              initialValues={settings}
              provinces={provinceQuery.data ?? []}
              provincesLoading={provinceQuery.isLoading}
              provincesError={provinceQuery.isError}
              onRetryProvinces={() => void provinceQuery.refetch()}
              pending={mutation.isPending}
              onValuesChange={setSettings}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>

        {/* Right column — challenge + preview */}
        <div className="flex flex-col gap-6">
          {challenge ? (
            <ChallengePanel retryAfterSeconds={challenge.retryAfterSeconds} />
          ) : null}

          <DataPreview
            cardType={cardType}
            rows={rows}
            onClear={handleClear}
            onImport={handleImport}
          />
        </div>
      </div>
    </main>
  );
}
