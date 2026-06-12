import { sqliteTable, integer, text, numeric, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// =====================================================
// Drizzle migrations tracking
// =====================================================

export const d1Migrations = sqliteTable("d1_migrations", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text(),
  appliedAt: numeric("applied_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// =====================================================
// Geographic hierarchy
// =====================================================

export const provinces = sqliteTable(
  "provinces",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
  },
  (table) => [index("provinces_name_idx").on(table.name)]
);

export const regencies = sqliteTable(
  "regencies",
  {
    id: text().primaryKey().notNull(),
    provinceId: text("province_id")
      .notNull()
      .references(() => provinces.id),
    name: text().notNull(),
  },
  (table) => [
    index("regencies_province_id_name_idx").on(table.provinceId, table.name),
    index("regencies_province_id_idx").on(table.provinceId),
  ]
);

export const districts = sqliteTable(
  "districts",
  {
    id: text().primaryKey().notNull(),
    regencyId: text("regency_id")
      .notNull()
      .references(() => regencies.id),
    provinceId: text("province_id")
      .notNull()
      .references(() => provinces.id),
    name: text().notNull(),
  },
  (table) => [
    index("districts_regency_id_name_idx").on(table.regencyId, table.name),
    index("districts_province_id_idx").on(table.provinceId),
    index("districts_regency_id_idx").on(table.regencyId),
  ]
);

export const villages = sqliteTable(
  "villages",
  {
    id: text().primaryKey().notNull(),
    districtId: text("district_id")
      .notNull()
      .references(() => districts.id),
    regencyId: text("regency_id")
      .notNull()
      .references(() => regencies.id),
    provinceId: text("province_id")
      .notNull()
      .references(() => provinces.id),
    name: text().notNull(),
  },
  (table) => [
    index("villages_district_id_id_idx").on(table.districtId, table.id),
    index("villages_regency_id_id_idx").on(table.regencyId, table.id),
    index("villages_district_id_name_idx").on(table.districtId, table.name),
    index("villages_province_id_idx").on(table.provinceId),
    index("villages_regency_id_idx").on(table.regencyId),
    index("villages_district_id_idx").on(table.districtId),
  ]
);

// =====================================================
// Rate limiting
// =====================================================

export const rateLimitBuckets = sqliteTable(
  "rate_limit_buckets",
  {
    key: text().primaryKey().notNull(),
    scope: text().notNull(),
    windowStart: integer("window_start").notNull(),
    windowSeconds: integer("window_seconds").notNull(),
    requestCount: integer("request_count").notNull(),
    challengeAfter: integer("challenge_after").notNull(),
    blockAfter: integer("block_after").notNull(),
    blockedUntil: integer("blocked_until").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("rate_limit_buckets_scope_updated_at_idx").on(
      table.scope,
      table.updatedAt,
    ),
  ],
);

export const rateLimitChallenges = sqliteTable("rate_limit_challenges", {
  id: text().primaryKey().notNull(),
  visitorHash: text("visitor_hash").notNull(),
  challengeHash: text("challenge_hash").notNull(),
  difficulty: integer().notNull(),
  expiresAt: integer("expires_at").notNull(),
  solvedAt: integer("solved_at"),
  createdAt: integer("created_at").notNull(),
});

// =====================================================
// Security & audit
// =====================================================

export const securityEvents = sqliteTable(
  "security_events",
  {
    id: text().primaryKey().notNull(),
    eventType: text("event_type").notNull(),
    visitorHash: text("visitor_hash"),
    ipHash: text("ip_hash"),
    scope: text(),
    reason: text(),
    metadataJson: text("metadata_json"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("security_events_created_at_idx").on(table.createdAt)]
);

// =====================================================
// Generation audit
// =====================================================

export const generationRequests = sqliteTable(
  "generation_requests",
  {
    id: text().primaryKey().notNull(),
    visitorHash: text("visitor_hash"),
    ipHash: text("ip_hash"),
    userAgentHash: text("user_agent_hash"),
    regionScope: text("region_scope").notNull(),
    provinceId: text("province_id"),
    regencyId: text("regency_id"),
    districtId: text("district_id"),
    villageId: text("village_id"),
    gender: text(),
    minAge: integer("min_age").notNull(),
    maxAge: integer("max_age").notNull(),
    requestedCount: integer("requested_count").notNull(),
    generatedCount: integer("generated_count").notNull(),
    decision: text().notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("generation_requests_visitor_created_at_idx").on(
      table.visitorHash,
      table.createdAt,
    ),
    index("generation_requests_ip_created_at_idx").on(
      table.ipHash,
      table.createdAt,
    ),
  ],
);

// =====================================================
// Visitor reputation and rate limit decisions
// =====================================================

export const visitorReputations = sqliteTable(
  "visitor_reputations",
  {
    visitorHash: text("visitor_hash").primaryKey().notNull(),
    score: integer().notNull().default(0),
    successfulRequests: integer("successful_requests").notNull().default(0),
    challengedRequests: integer("challenged_requests").notNull().default(0),
    blockedRequests: integer("blocked_requests").notNull().default(0),
    failedChallenges: integer("failed_challenges").notNull().default(0),
    lastCountry: text("last_country"),
    lastColo: text("last_colo"),
    lastLatitude: numeric("last_latitude"),
    lastLongitude: numeric("last_longitude"),
    lastSeenAt: integer("last_seen_at"),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("visitor_reputations_updated_at_idx").on(table.updatedAt),
  ],
);

export const rateLimitDecisions = sqliteTable(
  "rate_limit_decisions",
  {
    id: text().primaryKey().notNull(),
    visitorHash: text("visitor_hash"),
    ipHash: text("ip_hash"),
    userAgentHash: text("user_agent_hash"),
    scope: text().notNull(),
    decision: text().notNull(),
    riskScore: integer("risk_score").notNull(),
    reasonsJson: text("reasons_json").notNull(),
    requestCost: integer("request_cost").notNull(),
    country: text(),
    colo: text(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("rate_limit_decisions_created_at_idx").on(table.createdAt),
    index("rate_limit_decisions_visitor_created_at_idx").on(
      table.visitorHash,
      table.createdAt,
    ),
    index("rate_limit_decisions_ip_created_at_idx").on(
      table.ipHash,
      table.createdAt,
    ),
  ],
);

// =====================================================
// Inferred types
// =====================================================

export type Province = typeof provinces.$inferSelect;
export type NewProvince = typeof provinces.$inferInsert;
export type Regency = typeof regencies.$inferSelect;
export type NewRegency = typeof regencies.$inferInsert;
export type District = typeof districts.$inferSelect;
export type NewDistrict = typeof districts.$inferInsert;
export type Village = typeof villages.$inferSelect;
export type NewVillage = typeof villages.$inferInsert;
export type RateLimitBucket = typeof rateLimitBuckets.$inferSelect;
export type NewRateLimitBucket = typeof rateLimitBuckets.$inferInsert;
export type RateLimitChallenge = typeof rateLimitChallenges.$inferSelect;
export type NewRateLimitChallenge = typeof rateLimitChallenges.$inferInsert;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type NewSecurityEvent = typeof securityEvents.$inferInsert;
export type GenerationRequest = typeof generationRequests.$inferSelect;
export type NewGenerationRequest = typeof generationRequests.$inferInsert;
export type VisitorReputation = typeof visitorReputations.$inferSelect;
export type NewVisitorReputation = typeof visitorReputations.$inferInsert;
export type RateLimitDecisionRow = typeof rateLimitDecisions.$inferSelect;
export type NewRateLimitDecisionRow = typeof rateLimitDecisions.$inferInsert;
