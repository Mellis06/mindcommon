const mongoose = require("mongoose");

const auditEventSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  action: { type: String, required: true, maxlength: 80 },
  resourceType: { type: String, required: true, maxlength: 50 },
  resourceId: { type: String, maxlength: 80 },
  // Store only minimal governance metadata; never put health narratives, passwords, or tokens here.
  details: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true, versionKey: false });

auditEventSchema.index({ actorId: 1, createdAt: -1 });

// There are intentionally no application routes for updating or deleting audit events.
// Database administrators can still alter data; this is not a cryptographically immutable log.
module.exports = mongoose.models.AuditEvent || mongoose.model("AuditEvent", auditEventSchema);
