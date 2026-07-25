const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/admin.middleware");
const {
  listPublicPosts,
  getPostBySlug,
  listAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} = require("../controller/posts.controller");

// Admin — manage posts (drafts + published). Must come before "/:slug".
router.get("/admin/all", authMiddleware, requireAdmin, listAllPosts);
router.get("/admin/:id", authMiddleware, requireAdmin, getPostById);
router.post("/admin", authMiddleware, requireAdmin, createPost);
router.put("/admin/:id", authMiddleware, requireAdmin, updatePost);
router.delete("/admin/:id", authMiddleware, requireAdmin, deletePost);

// Public — anyone can read published posts
router.get("/", listPublicPosts);
router.get("/:slug", getPostBySlug);

module.exports = router;
