import assert from "node:assert/strict";
import { test } from "node:test";

import { fetchRegionSummaryFromDb } from "./regions";

function result<T>(results: T[]): D1Result<T> {
  return {
    results,
    success: true,
    meta: {} as D1Meta & Record<string, unknown>,
  };
}

test("fetchRegionSummaryFromDb returns counts and sample provinces", async () => {
  const queries: string[] = [];
  const db = {
    prepare(query: string) {
      queries.push(query);
      return { query };
    },
    async batch() {
      return [
        result([{ n: 38 }]),
        result([{ n: 514 }]),
        result([{ n: 7265 }]),
        result([{ n: 83345 }]),
        result([
          { id: "11", name: "Aceh", regency_count: 23 },
          { id: "12", name: "Sumatera Utara", regency_count: 33 },
        ]),
      ];
    },
  };

  const summary = await fetchRegionSummaryFromDb(db as never);

  assert.deepEqual(summary.counts, {
    provinces: 38,
    regencies: 514,
    districts: 7265,
    villages: 83345,
  });
  assert.deepEqual(summary.sampleProvinces, [
    { id: "11", name: "Aceh", regencyCount: 23 },
    { id: "12", name: "Sumatera Utara", regencyCount: 33 },
  ]);
  assert.equal(queries.length, 5);
});
