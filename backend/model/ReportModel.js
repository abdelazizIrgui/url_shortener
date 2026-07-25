const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ["bioPage", "shortLink"], required: true },
    targetValue: { type: String, required: true, trim: true }, // username or short code
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    reporterIp: { type: String, default: "" },
    status: { type: String, enum: ["open", "reviewed", "dismissed"], default: "open" },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
