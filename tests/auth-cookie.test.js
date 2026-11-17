const test = require("node:test");
const assert = require("node:assert/strict");
const { cookieOptions } = require("../server/middleware/auth");

test("development cookie is HttpOnly and path-scoped", () => {
  const previous = {
    nodeEnv: process.env.NODE_ENV,
    sameSite: process.env.COOKIE_SAME_SITE,
    secure: process.env.COOKIE_SECURE,
    domain: process.env.COOKIE_DOMAIN
  };

  process.env.NODE_ENV = "development";
  process.env.COOKIE_SAME_SITE = "strict";
  process.env.COOKIE_SECURE = "false";
  delete process.env.COOKIE_DOMAIN;

  const options = cookieOptions();
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, false);
  assert.equal(options.sameSite, "strict");
  assert.equal(options.path, "/api");

  if (previous.nodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous.nodeEnv;
  if (previous.sameSite === undefined) delete process.env.COOKIE_SAME_SITE; else process.env.COOKIE_SAME_SITE = previous.sameSite;
  if (previous.secure === undefined) delete process.env.COOKIE_SECURE; else process.env.COOKIE_SECURE = previous.secure;
  if (previous.domain === undefined) delete process.env.COOKIE_DOMAIN; else process.env.COOKIE_DOMAIN = previous.domain;
});

test("cross-site cookie configuration requires Secure", () => {
  const previous = {
    nodeEnv: process.env.NODE_ENV,
    sameSite: process.env.COOKIE_SAME_SITE,
    secure: process.env.COOKIE_SECURE
  };

  process.env.NODE_ENV = "development";
  process.env.COOKIE_SAME_SITE = "none";
  process.env.COOKIE_SECURE = "false";

  assert.throws(() => cookieOptions(), /COOKIE_SECURE=true/);

  if (previous.nodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous.nodeEnv;
  if (previous.sameSite === undefined) delete process.env.COOKIE_SAME_SITE; else process.env.COOKIE_SAME_SITE = previous.sameSite;
  if (previous.secure === undefined) delete process.env.COOKIE_SECURE; else process.env.COOKIE_SECURE = previous.secure;
});
