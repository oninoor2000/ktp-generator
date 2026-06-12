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

interface CountRow {
  n?: number;
}

interface ProvinceRow {
  id: string;
  name: string;
  regency_count: number;
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
      (sampleProvinces as D1Result<ProvinceRow>).results ?? []
    ).map((province) => ({
      id: province.id,
      name: province.name,
      regencyCount: Number(province.regency_count ?? 0),
    })),
  };
}
