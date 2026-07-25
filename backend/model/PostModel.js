const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: {
      type: String, required: true, unique: true, lowercase: true, trim: true,
      match: /^[a-z0-9-]{3,120}$/,
    },
    excerpt: { type: String, default: "", trim: true, maxlength: 300 },
    content: { type: String, required: true }, // Markdown or HTML from the editor
    coverImage: { type: String, default: "" }, // base64 data URL or external URL
    tags: [{ type: String, trim: true, lowercase: true }],
    metaDescription: { type: String, default: "", trim: true, maxlength: 160 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ tags: 1 });

module.exports = mongoose.model("Post", postSchema);
