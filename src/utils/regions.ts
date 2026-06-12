export interface RegionSummary {
  counts: {
    provinces: number;
    regencies: number;
    districts: number;
    villages: number;
  };
  sampleProvinces: Array<{
    id: string;
    name: string;
    regencyCount: number;
  }>;
}

export interface ProvinceRow {
  id: string;
  name: string;
}

export interface RegionalData {
  province: { id: string; name: string };
  regency: { id: string; name: string };
  district: { id: string; name: string };
  village: { id: string; name: string };
}

interface CountRow {
  n?: number;
}

interface ProvinceRowWithCount {
  id: string;
  name: string;
  regency_count: number;
}

interface JoinedRegionRow {
  province_id: string;
  province_name: string;
  regency_id: string;
  regency_name: string;
  district_id: string;
  district_name: string;
  village_id: string;
  village_name: string;
}

type D1LikeDatabase = Pick<D1Database, "batch" | "prepare">;

function firstResult<T>(result: D1Result<T>): T | undefined {
  return result.results?.[0];
}

function countFrom(result: D1Result<CountRow>): number {
  return Number(firstResult(result)?.n ?? 0);
}

export async function fetchRegionSummaryFromDb(
  db: D1LikeDatabase,
): Promise<RegionSummary> {
  const [provinces, regencies, districts, villages, sampleProvinces] =
    await db.batch([
      db.prepare("SELECT COUNT(*) AS n FROM provinces"),
      db.prepare("SELECT COUNT(*) AS n FROM regencies"),
      db.prepare("SELECT COUNT(*) AS n FROM districts"),
      db.prepare("SELECT COUNT(*) AS n FROM villages"),
      db.prepare(`
        SELECT
          provinces.id,
          provinces.name,
          COUNT(regencies.id) AS regency_count
        FROM provinces
        LEFT JOIN regencies ON regencies.province_id = provinces.id
        GROUP BY provinces.id, provinces.name
        ORDER BY provinces.id
        LIMIT 6
      `),
    ]);

  return {
    counts: {
      provinces: countFrom(provinces as D1Result<CountRow>),
      regencies: countFrom(regencies as D1Result<CountRow>),
      districts: countFrom(districts as D1Result<CountRow>),
      villages: countFrom(villages as D1Result<CountRow>),
    },
    sampleProvinces: (
      (sampleProvinces as D1Result<ProvinceRowWithCount>).results ?? []
    ).map((province) => ({
      id: province.id,
      name: province.name,
      regencyCount: Number(province.regency_count ?? 0),
    })),
  };
}

export async function fetchProvincesFromDb(
  db: D1LikeDatabase,
): Promise<ProvinceRow[]> {
  const result = (await db
    .prepare(
      "SELECT id, name FROM provinces ORDER BY name ASC",
    )
    .all()) as D1Result<ProvinceRow>;
  return (result.results ?? []).map((row) => ({
    id: row.id,
    name: row.name,
  }));
}

/**
 * Fetch `count` random joined region rows whose province is in `provinceIds`.
 * Uses parameterized placeholders. Caller must validate `provinceIds` (length,
 * format) and clamp `count` to a sane bound before calling.
 */
export async function fetchRandomRegionalRowsFromDb(
  db: D1LikeDatabase,
  args: { provinceIds: string[]; count: number },
): Promise<RegionalData[]> {
  const { provinceIds, count } = args;
  if (provinceIds.length === 0 || count <= 0) return [];

  const placeholders = provinceIds.map(() => "?").join(", ");
  const stmt = db.prepare(
    `SELECT
       provinces.id AS province_id,
       provinces.name AS province_name,
       regencies.id AS regency_id,
       regencies.name AS regency_name,
       districts.id AS district_id,
       districts.name AS district_name,
       villages.id AS village_id,
       villages.name AS village_name
     FROM villages
     JOIN districts ON districts.id = villages.district_id
     JOIN regencies ON regencies.id = villages.regency_id
     JOIN provinces ON provinces.id = villages.province_id
     WHERE villages.province_id IN (${placeholders})
     ORDER BY RANDOM()
     LIMIT ?`,
  );
  const bound = stmt.bind(...provinceIds, count);
  const result = (await bound.all()) as D1Result<JoinedRegionRow>;
  return (result.results ?? []).map((row) => ({
    province: { id: row.province_id, name: row.province_name },
    regency: { id: row.regency_id, name: row.regency_name },
    district: { id: row.district_id, name: row.district_name },
    village: { id: row.village_id, name: row.village_name },
  }));
}
