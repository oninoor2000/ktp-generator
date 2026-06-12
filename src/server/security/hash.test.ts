import assert from "node:assert/strict";
import { test } from "node:test";

import {
  hmacHex,
  issueVisitorCookie,
  sha256Hex,
  verifyVisitorCookie,
} from "./hash";

const SECRET = "test-secret-key-32-bytes-xxxxxxxx";

test("hmacHex returns stable lowercase hex for same secret and input", async () => {
  const a = await hmacHex(SECRET, "hello");
  const b = await hmacHex(SECRET, "hello");
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{64}$/);
});

test("hmacHex changes when secret changes", async () => {
  const a = await hmacHex(SECRET, "hello");
  const b = await hmacHex("other-secret-32-bytes-xxxxxxxx", "hello");
  assert.notEqual(a, b);
});

test("hmacHex changes when input changes", async () => {
  const a = await hmacHex(SECRET, "hello");
  const b = await hmacHex(SECRET, "world");
  assert.notEqual(a, b);
});

test("sha256Hex returns stable lowercase hex", async () => {
  const a = await sha256Hex("payload");
  const b = await sha256Hex("payload");
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{64}$/);
});

test("verify signed visitor cookie accepts valid signature", async () => {
  const cookie = await issueVisitorCookie(SECRET);
  const result = await verifyVisitorCookie(SECRET, cookie.cookieValue);
  assert.equal(result.valid, true);
  assert.equal(result.visitorId, cookie.visitorId);
});

test("verify signed visitor cookie rejects tampered visitor id", async () => {
  const cookie = await issueVisitorCookie(SECRET);
  const tampered = `deadbeef.${cookie.signature}`;
  const result = await verifyVisitorCookie(SECRET, tampered);
  assert.equal(result.valid, false);
});

test("verify signed visitor cookie rejects tampered signature", async () => {
  const cookie = await issueVisitorCookie(SECRET);
  const tampered = `${cookie.visitorId}.00000000000000000000000000000000`;
  const result = await verifyVisitorCookie(SECRET, tampered);
  assert.equal(result.valid, false);
});

test("verify signed visitor cookie rejects malformed input", async () => {
  for (const value of [undefined, "", "no-dot", ".sig", "id."]) {
    const result = await verifyVisitorCookie(SECRET, value);
    assert.equal(result.valid, false, `value=${String(value)}`);
  }
});
