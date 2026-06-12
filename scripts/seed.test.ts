import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildSeedSql,
  parseSqlInserts,
} from "./seed";

const SAMPLE_SQL = `
INSERT INTO wilayah (kode,nama) VALUES
('11','ACEH'),
('11.01','KAB. ACEH SELATAN'),
('11.01.01','BAKONGAN'),
('11.01.01.2001','KEUDE BAKONGAN');
`;

test("parseSqlInserts normalizes wilayah hierarchy into local tables", () => {
  const parsed = parseSqlInserts(SAMPLE_SQL);

  assert.deepEqual(parsed.provinces, [{ id: "11", name: "ACEH" }]);
  assert.deepEqual(parsed.regencies, [
    { id: "1101", province_id: "11", name: "KAB. ACEH SELATAN" },
  ]);
  assert.deepEqual(parsed.districts, [
    {
      id: "110101",
      regency_id: "1101",
      province_id: "11",
      name: "BAKONGAN",
    },
  ]);
  assert.deepEqual(parsed.villages, [
    {
      id: "1101012001",
      district_id: "110101",
      regency_id: "1101",
      province_id: "11",
      name: "KEUDE BAKONGAN",
    },
  ]);
});

test("buildSeedSql creates one reusable SQL script with batched inserts", () => {
  const parsed = parseSqlInserts(SAMPLE_SQL);
  const sql = buildSeedSql(parsed, { batchSize: 2 });

  assert.match(sql, /Source: https:\/\/github\.com\/cahyadsn\/wilayah/);
  assert.match(sql, /BEGIN TRANSACTION;/);
  assert.match(sql, /INSERT INTO "provinces"/);
  assert.match(sql, /INSERT INTO "villages"/);
  assert.match(sql, /ON CONFLICT\("id"\) DO UPDATE SET/);
  assert.match(sql, /COMMIT;/);
  assert.equal((sql.match(/INSERT INTO/g) ?? []).length, 4);
});

test("parseSqlInserts drops rows that would violate region foreign keys", () => {
  const parsed = parseSqlInserts(`
INSERT INTO wilayah (kode,nama) VALUES
('12','SUMATERA UTARA'),
('12.04','KAB. NIAS'),
('12.04.27','SOMETHING VALID'),
('12.04.27.2001','VALID VILLAGE'),
('12.04.28.2001','ORPHAN VILLAGE');
`);

  assert.deepEqual(parsed.villages, [
    {
      id: "1204272001",
      district_id: "120427",
      regency_id: "1204",
      province_id: "12",
      name: "VALID VILLAGE",
    },
  ]);
});
