const test = require("node:test");
const assert = require("node:assert/strict");
const {
  registerSchema,
  consentSchema,
  accessRequestSchema,
  reviewSchema
} = require("../server/validation/schemas");

test("registration rejects short passwords", () => {
  const result = registerSchema.safeParse({
    name: "Demo User",
    email: "demo@example.test",
    password: "short"
  });
  assert.equal(result.success, false);
});

test("registration rejects client-supplied role escalation", () => {
  const result = registerSchema.safeParse({
    name: "Demo User",
    email: "demo@example.test",
    password: "a-long-demo-password",
    role: "admin"
  });
  assert.equal(result.success, false);
});

test("consent requires a recognised purpose and status", () => {
  assert.equal(consentSchema.safeParse({
    purpose: "research",
    status: "granted",
    noticeVersion: "v1"
  }).success, true);

  assert.equal(consentSchema.safeParse({
    purpose: "any-purpose",
    status: "granted",
    noticeVersion: "v1"
  }).success, false);
});

test("access request is restricted to synthetic-demo scope", () => {
  const base = {
    recipientName: "Community Research Team",
    recipientOrganisation: "Example Community Group",
    purpose: "research",
    rationale: "We need to review the synthetic demonstration workflow."
  };

  assert.equal(accessRequestSchema.safeParse({ ...base, scope: "synthetic-demo" }).success, true);
  assert.equal(accessRequestSchema.safeParse({ ...base, scope: "all-records" }).success, false);
});

test("review decision requires a substantive note", () => {
  assert.equal(reviewSchema.safeParse({ status: "approved", reviewNote: "Reviewed against the current demo policy." }).success, true);
  assert.equal(reviewSchema.safeParse({ status: "approved", reviewNote: "OK" }).success, false);
});
