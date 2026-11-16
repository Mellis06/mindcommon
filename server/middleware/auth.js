const jwt = require("jsonwebtoken");
const User = require("../models/User");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }
  return secret;
}

function issueToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h", issuer: "mindcommon-api", audience: "mindcommon-client" }
  );
}

async function requireAuth(req, res, next) {
  try {
    const header = req.get("authorization") || "";
    const match = header.match(/^Bearer\\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: "UNAUTHENTICATED", message: "A bearer token is required." });

    const payload = jwt.verify(match[1], getJwtSecret(), {
      issuer: "mindcommon-api",
      audience: "mindcommon-client"
    });
    const user = await User.findById(payload.sub).select("_id name email role");
    if (!user) return res.status(401).json({ error: "UNAUTHENTICATED", message: "The account is unavailable." });

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "UNAUTHENTICATED", message: "The token is invalid or expired." });
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

module.exports = { requireAuth, requireRole, issueToken, getJwtSecret };
