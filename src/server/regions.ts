import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

import {
  fetchProvincesFromDb,
  fetchRandomRegionalRowsFromDb,
  fetchRegionSummaryFromDb,
  type RegionalData,
} from "~/utils/regions";

export const fetchRegionSummary = createServerFn({ method: "GET" }).handler(
  async () => {
    return fetchRegionSummaryFromDb(env.DB);
  },
);

export const fetchProvinces = createServerFn({ method: "GET" }).handler(
  async () => {
    return fetchProvincesFromDb(env.DB);
  },
);

export const fetchRandomRegionalRows = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (data && typeof data === "object") {
      const input = data as { provinceIds?: unknown; count?: unknown };
      const provinceIds = Array.isArray(input.provinceIds)
        ? input.provinceIds.filter(
            (id): id is string => typeof id === "string",
          )
        : [];
      const count =
        typeof input.count === "number" && Number.isFinite(input.count)
          ? Math.min(1000, Math.max(1, Math.floor(input.count)))
          : 1;
      return { provinceIds, count };
    }
    return { provinceIds: [] as string[], count: 1 };
  })
  .handler(async ({ data }) => {
    return fetchRandomRegionalRowsFromDb(env.DB, data) as Promise<
      RegionalData[]
    >;
  });
