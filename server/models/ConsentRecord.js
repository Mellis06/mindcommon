const mongoose = require("mongoose");

const consentRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  purpose: { type: String, enum: ["programme", "research", "ai"], required: true },
  status: { type: String, enum: ["granted", "withdrawn"], required: true },
  noticeVersion: { type: String, required: true, trim: true, maxlength: 40 }
}, { timestamps: true, versionKey: false });

consentRecordSchema.index({ userId: 1, purpose: 1, createdAt: -1 });

module.exports = mongoose.models.ConsentRecord || mongoose.model("ConsentRecord", consentRecordSchema);
