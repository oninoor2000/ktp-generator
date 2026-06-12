import assert from "node:assert/strict";
import { test } from "node:test";

import { generatorSettingsSchema } from "./schemas";

const now = Date.now();

test("accepts valid KTP settings", () => {
  const result = generatorSettingsSchema.safeParse({
    cardType: "KTP",
    dataCount: 10,
    minAge: 18,
    maxAge: 60,
    gender: "BOTH",
    provinceIds: ["31"],
    honeypot: "",
    clientStartedAt: now - 60_000,
  });

  assert.equal(result.success, true);
});

test("accepts valid KTA settings", () => {
  const result = generatorSettingsSchema.safeParse({
    cardType: "KTA",
    dataCount: 10,
    minAge: 1,
    maxAge: 16,
    gender: "BOTH",
    provinceIds: ["31"],
    honeypot: "",
    clientStartedAt: now - 60_000,
  });

  assert.equal(result.success, true);
});

test("rejects KTP minimum age below 17", () => {
  const result = generatorSettingsSchema.safeParse({
    cardType: "KTP",
    dataCount: 10,
    minAge: 16,
    maxAge: 60,
    gender: "BOTH",
    provinceIds: ["31"],
    honeypot: "",
  });

  assert.equal(result.success, false);
  assert.match(String(result.error), /KTP minimum age/i);
});

test("rejects KTA maximum age above 16", () => {
  const result = generatorSettingsSchema.safeParse({
    cardType: "KTA",
    dataCount: 10,
    minAge: 1,
    maxAge: 17,
    gender: "BOTH",
    provinceIds: ["31"],
    honeypot: "",
  });

  assert.equal(result.success, false);
  assert.match(String(result.error), /KTA maximum age/i);
});

test("rejects max age lower than min age", () => {
  const result = generatorSettingsSchema.safeParse({
    cardType: "KTP",
    dataCount: 10,
    minAge: 40,
    maxAge: 20,
    gender: "BOTH",
    provinceIds: ["31"],
    honeypot: "",
  });

  assert.equal(result.success, false);
  assert.match(String(result.error), /Maximum age/i);
});

test("rejects data count above 1000", () => {
  const result = generatorSettingsSchema.safeParse({
    cardType: "KTP",
    dataCount: 1001,
    minAge: 18,
    maxAge: 60,
    gender: "BOTH",
    provinceIds: ["31"],
    honeypot: "",
  });

  assert.equal(result.success, false);
});

test("rejects empty province selection", () => {
  const result = generatorSettingsSchema.safeParse({
    cardType: "KTP",
    dataCount: 10,
    minAge: 18,
    maxAge: 60,
    gender: "BOTH",
    provinceIds: [],
    honeypot: "",
  });

  assert.equal(result.success, false);
});

test("rejects invalid province id format", () => {
  const result = generatorSettingsSchema.safeParse({
    cardType: "KTP",
    dataCount: 10,
    minAge: 18,
    maxAge: 60,
    gender: "BOTH",
    provinceIds: ["3171"],
    honeypot: "",
  });

  assert.equal(result.success, false);
  assert.match(String(result.error), /2-digit code/i);
});

test("rejects filled honeypot", () => {
  const result = generatorSettingsSchema.safeParse({
    cardType: "KTP",
    dataCount: 10,
    minAge: 18,
    maxAge: 60,
    gender: "BOTH",
    provinceIds: ["31"],
    honeypot: "bot-value",
  });

  assert.equal(result.success, false);
});

test("accepts empty honeypot", () => {
  const result = generatorSettingsSchema.safeParse({
    cardType: "KTP",
    dataCount: 10,
    minAge: 18,
    maxAge: 60,
    gender: "BOTH",
    provinceIds: ["31"],
    honeypot: "",
  });

  assert.equal(result.success, true);
});

test("rejects stale clientStartedAt older than one hour", () => {
  const result = generatorSettingsSchema.safeParse({
    cardType: "KTP",
    dataCount: 10,
    minAge: 18,
    maxAge: 60,
    gender: "BOTH",
    provinceIds: ["31"],
    honeypot: "",
    clientStartedAt: now - 3_700_000,
  });

  assert.equal(result.success, false);
  assert.match(String(result.error), /started/i);
});
