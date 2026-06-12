import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { fetchRegionSummaryFromDb } from "~/utils/regions";

export const fetchRegionSummary = createServerFn({ method: "GET" }).handler(
  async () => {
    return fetchRegionSummaryFromDb(env.DB);
  },
);
