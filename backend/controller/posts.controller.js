const Post = require("../model/PostModel");

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

const formatPost = (post) => ({
  id: post._id,
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt,
  content: post.content,
  coverImage: post.coverImage,
  tags: post.tags,
  metaDescription: post.metaDescription,
  status: post.status,
  publishedAt: post.publishedAt,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});

// ─── Public: list published posts ──────────────────────────────────────────
const listPublicPosts = async (req, res) => {
  try {
    const { tag, search = "", sort = "newest", page = 1, limit = 12 } = req.query;
    const filter = { status: "published" };
    if (tag) filter.tags = tag.toLowerCase();
    if (search && search.trim()) {
      const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: re }, { excerpt: re }, { tags: re }];
    }

    const sortSpec = sort === "oldest" ? { publishedAt: 1 } : { publishedAt: -1 };

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [posts, total] = await Promise.all([
      Post.find(filter).sort(sortSpec).skip(skip).limit(Number(limit)),
      Post.countDocuments(filter),
    ]);

    return res.json({
      posts: posts.map(formatPost),
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("[listPublicPosts]", err.message);
    return res.status(500).json({ message: "Error loading posts" });
  }
};

// ─── Public: single post by slug (published only) ──────────────────────────
const getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, status: "published" });
    if (!post) return res.status(404).json({ message: "Post not found" });
    return res.json({ post: formatPost(post) });
  } catch (err) {
    console.error("[getPostBySlug]", err.message);
    return res.status(500).json({ message: "Error loading post" });
  }
};

// ─── Admin: list all posts (drafts + published) ─────────────────────────────
const listAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({}).sort({ createdAt: -1 });
    return res.json({ posts: posts.map(formatPost) });
  } catch (err) {
    console.error("[listAllPosts]", err.message);
    return res.status(500).json({ message: "Error loading posts" });
  }
};

// ─── Admin: single post by id (any status) ─────────────────────────────────
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    return res.json({ post: formatPost(post) });
  } catch (err) {
    return res.status(500).json({ message: "Error loading post" });
  }
};

// ─── Admin: create post ─────────────────────────────────────────────────────
const createPost = async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, tags, metaDescription, status, slug } = req.body;

    if (!title || !title.trim()) return res.status(400).json({ message: "Title is required" });
    if (!content || !content.trim()) return res.status(400).json({ message: "Content is required" });

    let finalSlug = slug ? slugify(slug) : slugify(title);
    if (!finalSlug) return res.status(400).json({ message: "Could not generate a valid slug from the title" });

    let attempt = finalSlug;
    let n = 1;
    while (await Post.findOne({ slug: attempt })) {
      attempt = `${finalSlug}-${n++}`;
    }
    finalSlug = attempt;

    const isPublishing = status === "published";
    const post = await Post.create({
      title: title.trim(),
      slug: finalSlug,
      excerpt: excerpt || "",
      content,
      coverImage: coverImage || "",
      tags: Array.isArray(tags) ? tags.slice(0, 10).map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
      metaDescription: metaDescription || "",
      status: isPublishing ? "published" : "draft",
      authorId: req.userId,
      publishedAt: isPublishing ? new Date() : null,
    });

    return res.status(201).json({ message: "Post created", post: formatPost(post) });
  } catch (err) {
    console.error("[createPost]", err.message);
    if (err.code === 11000) return res.status(409).json({ message: "Slug already in use" });
    return res.status(500).json({ message: "Error creating post" });
  }
};

// ─── Admin: update post ─────────────────────────────────────────────────────
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const { title, excerpt, content, coverImage, tags, metaDescription, status, slug } = req.body;

    if (title !== undefined) post.title = title.trim();
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (content !== undefined) post.content = content;
    if (coverImage !== undefined) post.coverImage = coverImage;
    if (metaDescription !== undefined) post.metaDescription = metaDescription;
    if (Array.isArray(tags)) post.tags = tags.slice(0, 10).map((t) => t.trim().toLowerCase()).filter(Boolean);

    if (slug !== undefined && slug.trim()) {
      const newSlug = slugify(slug);
      if (newSlug !== post.slug) {
        const clash = await Post.findOne({ slug: newSlug, _id: { $ne: post._id } });
        if (clash) return res.status(409).json({ message: "Slug already in use" });
        post.slug = newSlug;
      }
    }

    if (status !== undefined && status !== post.status) {
      post.status = status;
      if (status === "published" && !post.publishedAt) post.publishedAt = new Date();
      if (status === "draft") post.publishedAt = null;
    }

    await post.save();
    return res.json({ message: "Post updated", post: formatPost(post) });
  } catch (err) {
    console.error("[updatePost]", err.message);
    return res.status(500).json({ message: "Error updating post" });
  }
};

// ─── Admin: delete post ─────────────────────────────────────────────────────
const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    return res.json({ message: "Post deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Error deleting post" });
  }
};

module.exports = {
  listPublicPosts,
  getPostBySlug,
  listAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
};
