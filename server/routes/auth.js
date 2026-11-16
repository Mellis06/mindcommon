const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { validateBody } = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validation/schemas");
const { issueToken } = require("../middleware/auth");
const { recordAudit } = require("../services/audit");

const router = express.Router();

router.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.validatedBody;
    const normalisedEmail = email.toLowerCase();
    const existing = await User.findOne({ email: normalisedEmail }).select("_id");
    if (existing) return res.status(409).json({ error: "ACCOUNT_EXISTS", message: "An account with that email already exists." });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: normalisedEmail, passwordHash });
    await recordAudit({
      actorId: user._id,
      action: "account.registered",
      resourceType: "user",
      resourceId: user._id.toString(),
      details: { role: "member" }
    });

    return res.status(201).json({
      token: issueToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: "ACCOUNT_EXISTS", message: "An account with that email already exists." });
    next(error);
  }
});

router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Email or password is incorrect." });
    }

    await recordAudit({
      actorId: user._id,
      action: "account.login",
      resourceType: "user",
      resourceId: user._id.toString()
    });

    return res.json({
      token: issueToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
