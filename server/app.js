const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { rateLimit } = require("express-rate-limit");
const authRoutes = require("./routes/auth");
const consentRoutes = require("./routes/consents");
const accessRequestRoutes = require("./routes/accessRequests");
const auditRoutes = require("./routes/audit");
const { getJwtSecret } = require("./middleware/auth");

function createApp() {
  getJwtSecret();

  const app = express();
  app.disable("x-powered-by");

  const trustProxy = Number(process.env.TRUST_PROXY || 0);
  if (Number.isInteger(trustProxy) && trustProxy > 0) app.set("trust proxy", trustProxy);

  const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
  app.use(express.json({ limit: "20kb", strict: true }));
  app.use(cookieParser());

  // Browser state-changing requests must originate from an explicitly configured frontend.
  // Requests without Origin are retained for controlled CLI/server-to-server development use.
  app.use("/api", (req, res, next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
    const origin = req.get("origin");
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: "UNTRUSTED_ORIGIN", message: "This browser origin is not allowed to change data." });
    }
    next();
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "mindcommon-api", mode: "prototype" });
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "RATE_LIMITED", message: "Too many authentication attempts. Try again later." }
  });
  app.post("/api/auth/register", authLimiter);
  app.post("/api/auth/login", authLimiter);
  app.use("/api/auth", authRoutes);
  app.use("/api/consents", consentRoutes);
  app.use("/api/access-requests", accessRequestRoutes);
  app.use("/api/audit-events", auditRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: "NOT_FOUND", message: "API route not found." });
  });

  app.use((error, req, res, next) => {
    const status = error.status && error.status < 500 ? error.status : 500;
    if (status >= 500) process.stderr.write("Request failed: " + error.message + "\n");
    res.status(status).json({
      error: "INTERNAL_ERROR",
      message: status >= 500 ? "An unexpected error occurred." : error.message
    });
  });

  return app;
}

module.exports = { createApp };
