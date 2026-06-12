import { createFileRoute } from "@tanstack/react-router";

import { GeneratorPage } from "~/features/generator/components/generator-page";

export const Route = createFileRoute("/")({
  component: IndexRouteComponent,
});

function IndexRouteComponent() {
  return <GeneratorPage cardType="KTP" />;
}
