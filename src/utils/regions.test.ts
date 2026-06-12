import assert from "node:assert/strict";
import { test } from "node:test";

import {
  fetchProvincesFromDb,
  fetchRandomRegionalRowsFromDb,
  fetchRegionSummaryFromDb,
} from "./regions";

function result<T>(results: T[]): D1Result<T> {
  return {
    results,
    success: true,
    meta: {} as D1Meta & Record<string, unknown>,
  };
}

function emptyResult<T>(): D1Result<T> {
  return result<T>([]);
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

test("fetchProvincesFromDb returns provinces ordered by name", async () => {
  const collected: { query: string; rows: unknown[] } = {
    query: "",
    rows: [],
  };
  const db = {
    prepare(query: string) {
      collected.query = query;
      return {
        async all() {
          return result([
            { id: "31", name: "DKI JAKARTA" },
            { id: "32", name: "JAWA BARAT" },
          ]);
        },
      };
    },
  };
  const provinces = await fetchProvincesFromDb(db as never);
  assert.equal(provinces.length, 2);
  assert.equal(provinces[0]?.id, "31");
  assert.match(collected.query, /ORDER BY name/i);
});

test("fetchRandomRegionalRowsFromDb maps joined rows into nested RegionalData", async () => {
  const calls: { query: string; params: unknown[] } = {
    query: "",
    params: [],
  };
  const db = {
    prepare(query: string) {
      calls.query = query;
      return {
        bind(...params: unknown[]) {
          calls.params = params;
          return {
            async all() {
              return result([
                {
                  province_id: "31",
                  province_name: "DKI JAKARTA",
                  regency_id: "3171",
                  regency_name: "KOTA JAKARTA PUSAT",
                  district_id: "317101",
                  district_name: "GAMBIR",
                  village_id: "3171011001",
                  village_name: "GAMBIR",
                },
              ]);
            },
          };
        },
      };
    },
  };
  const rows = await fetchRandomRegionalRowsFromDb(db as never, {
    provinceIds: ["31"],
    count: 5,
  });
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0]?.province, { id: "31", name: "DKI JAKARTA" });
  assert.deepEqual(rows[0]?.village, { id: "3171011001", name: "GAMBIR" });
  assert.deepEqual(calls.params, ["31", 5]);
});

test("fetchRandomRegionalRowsFromDb filters by selected province ids and uses bound params", async () => {
  const calls: { params: unknown[] } = { params: [] };
  const db = {
    prepare(query: string) {
      assert.match(query, /WHERE villages\.province_id IN \(\?, \?, \?\)/);
      return {
        bind(...params: unknown[]) {
          calls.params = params;
          return { async all() { return emptyResult(); } };
        },
      };
    },
  };
  await fetchRandomRegionalRowsFromDb(db as never, {
    provinceIds: ["31", "32", "33"],
    count: 10,
  });
  assert.deepEqual(calls.params, ["31", "32", "33", 10]);
});

test("fetchRandomRegionalRowsFromDb handles empty inputs", async () => {
  const db = {
    prepare() {
      throw new Error("should not query D1");
    },
  };
  assert.deepEqual(
    await fetchRandomRegionalRowsFromDb(db as never, {
      provinceIds: [],
      count: 10,
    }),
    [],
  );
  assert.deepEqual(
    await fetchRandomRegionalRowsFromDb(db as never, {
      provinceIds: ["31"],
      count: 0,
    }),
    [],
  );
});
