const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SESSION_COOKIE = "mindcommon_session";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }
  return secret;
}

function cookieOptions() {
  const sameSite = (process.env.COOKIE_SAME_SITE || "strict").toLowerCase();
  const secure = process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
  if (!["strict", "lax", "none"].includes(sameSite)) {
    throw new Error("COOKIE_SAME_SITE must be strict, lax, or none");
  }
  if (sameSite === "none" && !secure) {
    throw new Error("COOKIE_SECURE=true is required when COOKIE_SAME_SITE=none");
  }

  const options = {
    httpOnly: true,
    secure,
    sameSite,
    path: "/api",
    maxAge: Number(process.env.JWT_COOKIE_MAX_AGE_MS || 60 * 60 * 1000)
  };
  if (process.env.COOKIE_DOMAIN) options.domain = process.env.COOKIE_DOMAIN;
  return options;
}

function setSessionCookie(res, user) {
  const token = jwt.sign(
    { sub: user._id.toString() },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      issuer: "mindcommon-api",
      audience: "mindcommon-client"
    }
  );
  res.cookie(SESSION_COOKIE, token, cookieOptions());
}

function clearSessionCookie(res) {
  const options = cookieOptions();
  delete options.maxAge;
  res.clearCookie(SESSION_COOKIE, options);
}

async function requireAuth(req, res, next) {
  try {
    const header = req.get("authorization") || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    const token = req.cookies?.[SESSION_COOKIE] || (match ? match[1] : null);
    if (!token) {
      return res.status(401).json({ error: "UNAUTHENTICATED", message: "Please sign in to continue." });
    }

    const payload = jwt.verify(token, getJwtSecret(), {
      issuer: "mindcommon-api",
      audience: "mindcommon-client"
    });
    // Always read the current role from the database, not from client-controlled state or stale token claims.
    const user = await User.findById(payload.sub).select("_id name email role");
    if (!user) return res.status(401).json({ error: "UNAUTHENTICATED", message: "The account is unavailable." });

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "UNAUTHENTICATED", message: "Your session is invalid or expired. Please sign in again." });
    }
    next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "FORBIDDEN", message: "This role is not authorised for the requested action." });
    }
    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  setSessionCookie,
  clearSessionCookie,
  cookieOptions,
  getJwtSecret
};
