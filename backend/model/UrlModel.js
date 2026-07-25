const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    shortUrl: { type: String, required: true, unique: true },
    title: { type: String, default: "", trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, default: null },
    clicksCount: { type: Number, default: 0 },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", default: null },
    variants: [
      {
        url: { type: String, required: true },
        weight: { type: Number, default: 1, min: 1 },
        clicks: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

urlSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Url", urlSchema);
