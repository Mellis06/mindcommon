const express = require("express");
const AuditEvent = require("../models/AuditEvent");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/me", async (req, res, next) => {
  try {
    const events = await AuditEvent.find({
      $or: [
        { actorId: req.user._id },
        { subjectId: req.user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ events });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
