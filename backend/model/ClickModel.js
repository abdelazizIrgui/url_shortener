const mongoose = require("mongoose");

const clickSchema = new mongoose.Schema(
  {
    linkId: { type: mongoose.Schema.Types.ObjectId, ref: "Url", required: true },
    ip: { type: String, default: "" },
    country: { type: String, default: "Unknown" },
    device: { type: String, default: "Unknown" },
    browser: { type: String, default: "Unknown" },
    os: { type: String, default: "Unknown" },
    referrer: { type: String, default: "Direct" },
  },
  { timestamps: true }
);

clickSchema.index({ linkId: 1, createdAt: -1 });

module.exports = mongoose.model("Click", clickSchema);
