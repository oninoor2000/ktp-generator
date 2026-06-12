import { createFileRoute } from "@tanstack/react-router";

import { GeneratorPage } from "~/features/generator/components/generator-page";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/kta")({
  head: () => ({
    meta: seo({
      title: "KTP Lab - Generator Data KTA Anak Dummy",
      description:
        "Buat data KTA anak dummy Indonesia untuk testing, development, dan mockup. Data wilayah bersumber dari cahyadsn/wilayah dan disimpan di Cloudflare D1.",
      keywords:
        "generator kta dummy, data kta anak, nik anak dummy, data testing indonesia, wilayah indonesia",
    }),
  }),
  component: KtaRouteComponent,
});

function KtaRouteComponent() {
  return <GeneratorPage cardType="KTA" />;
}
