import { createFileRoute } from "@tanstack/react-router";

import { GeneratorPage } from "~/features/generator/components/generator-page";

export const Route = createFileRoute("/kta")({
  component: KtaRouteComponent,
});

function KtaRouteComponent() {
  return <GeneratorPage cardType="KTA" />;
}
