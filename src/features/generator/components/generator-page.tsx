"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  FileTextIcon,
  ShieldAlertIcon,
  SparklesIcon,
  TablePropertiesIcon,
} from "lucide-react";

import { ModeToggle } from "~/components/mode-toggle";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useGenerateCardData } from "~/features/generator/hooks/use-generate-card-data";
import { useGeneratorPreferences } from "~/features/generator/hooks/use-generator-preferences";
import { GeneratorForm } from "~/features/generator/components/generator-form";
import { ChallengePanel } from "~/features/generator/components/challenge-panel";
import type { CardType, GeneratedRow, GeneratorSettings } from "~/features/generator/domain/types";
import { fetchProvinces } from "~/server/regions";

const COPY = {
  KTP: {
    title: "KTP Generator",
    subtitle: "Buat data KTP dummy untuk pengujian dan pengembangan.",
    formTitle: "Generator Data KTP",
    formDescription: "Atur batch data lalu hasilkan identitas Indonesia palsu untuk kebutuhan pengujian.",
    empty: "Belum ada data KTP. Hasilkan data untuk melihat pratinjau batch.",
  },
  KTA: {
    title: "KTA Generator",
    subtitle: "Buat data KTA anak dummy untuk pengujian dan pengembangan.",
    formTitle: "Generator Data KTA",
    formDescription: "Atur batch data lalu hasilkan identitas anak palsu untuk kebutuhan pengujian.",
    empty: "Belum ada data KTA. Hasilkan data untuk melihat pratinjau batch.",
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

  React.useEffect(() => {
    if (!provinceQuery.data?.length || settings.provinceIds.length > 0) {
      return;
    }

    const jakarta = provinceQuery.data.find((province) =>
      /jakarta/i.test(province.name),
    );
    const first = jakarta ?? provinceQuery.data[0];
    if (!first) {
      return;
    }

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

  const provinceCount = new Set(rows.map((row) => row.province)).size;
  const maleCount = rows.filter((row) => row.gender === "LAKI-LAKI").length;
  const femaleCount = rows.filter((row) => row.gender === "PEREMPUAN").length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-start justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              {copy.title}
            </p>
            <h1 className="text-2xl font-semibold uppercase">{copy.title}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">{copy.subtitle}</p>
            <p className="text-sm text-muted-foreground">
              Data yang dihasilkan bersifat palsu dan hanya boleh digunakan untuk pengujian, pengembangan, dan mockup.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button render={<Link to="/" />} variant={cardType === "KTP" ? "secondary" : "ghost"}>
              KTP
            </Button>
            <Button render={<Link to="/kta" />} variant={cardType === "KTA" ? "secondary" : "ghost"}>
              KTA
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[420px_minmax(0,1fr)] lg:px-8">
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

        <div className="flex flex-col gap-6">
          {challenge ? <ChallengePanel retryAfterSeconds={challenge.retryAfterSeconds} /> : null}

          <Card>
            <CardHeader>
              <CardTitle>Pratinjau Data {cardType}</CardTitle>
              <CardDescription>
                {rows.length > 0 ? `${rows.length} data berhasil dibuat.` : copy.empty}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid gap-4 sm:grid-cols-4">
                <Metric label="Total Data" value={rows.length} icon={<TablePropertiesIcon />} />
                <Metric label="Laki-laki" value={maleCount} icon={<SparklesIcon />} />
                <Metric label="Perempuan" value={femaleCount} icon={<SparklesIcon />} />
                <Metric label="Provinsi" value={provinceCount} icon={<FileTextIcon />} />
              </div>

              {rows.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center gap-3 border border-dashed border-border p-6 text-center">
                  <ShieldAlertIcon className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{copy.empty}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>NIK</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Provinsi</TableHead>
                      <TableHead>Kota</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 10).map((row, index) => (
                      <TableRow key={`${row.nik}-${index}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.nik}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{row.gender}</Badge>
                        </TableCell>
                        <TableCell>{row.province}</TableCell>
                        <TableCell>{row.city}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border border-border p-4">
      <div className="flex items-center justify-between gap-2 text-muted-foreground">
        <span className="text-xs font-semibold uppercase">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-semibold">{value.toLocaleString("id-ID")}</p>
    </div>
  );
}
