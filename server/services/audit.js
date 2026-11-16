const AuditEvent = require("../models/AuditEvent");

async function recordAudit({ actorId, subjectId = actorId, action, resourceType, resourceId, details = {} }) {
  // Callers pass only minimal metadata. Never pass request bodies or sensitive participant content.
  return AuditEvent.create({ actorId, subjectId, action, resourceType, resourceId, details });
}

module.exports = { recordAudit };
