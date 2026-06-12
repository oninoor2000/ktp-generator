import { createFileRoute } from "@tanstack/react-router";

import { GeneratorPage } from "~/features/generator/components/generator-page";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: seo({
      title: "KTP Lab - Generator Data KTP Dummy Indonesia",
      description:
        "Buat data KTP dummy Indonesia untuk testing, development, dan mockup. Data wilayah bersumber dari cahyadsn/wilayah dan disimpan di Cloudflare D1.",
      keywords:
        "generator ktp dummy, data ktp testing, nik dummy, ktp indonesia, wilayah indonesia",
    }),
  }),
  component: IndexRouteComponent,
});

function IndexRouteComponent() {
  return <GeneratorPage cardType="KTP" />;
}
