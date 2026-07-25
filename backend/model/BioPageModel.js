const mongoose = require("mongoose");

const bioLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    icon: { type: String, default: "" },
  },
  { _id: true }
);

const bioPageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    username: {
      type: String, required: true, unique: true, lowercase: true, trim: true,
      match: /^[a-z0-9_-]{3,40}$/,
    },
    displayName: { type: String, default: "", trim: true },
    bio: { type: String, default: "", trim: true, maxlength: 280 },
    // Base64 data URL for bio page avatar (can differ from user account avatar)
    avatarBase64: { type: String, default: "" },
    // Wide banner image shown behind the avatar on the public page
    coverImageBase64: { type: String, default: "" },
    theme: { type: String, default: "default" },
    isPublished: { type: Boolean, default: true },
    links: [bioLinkSchema],
    // Every label/url pair the user has ever added to their bio page,
    // even ones later removed — lets the editor offer "add it back"
    // shortcuts instead of making them retype a link they used before.
    // Capped and deduplicated by URL in the controller, most-recent-first.
    linkHistory: [bioLinkSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("BioPage", bioPageSchema);
