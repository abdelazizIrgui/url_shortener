const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

campaignSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Campaign", campaignSchema);
