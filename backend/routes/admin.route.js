const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/admin.middleware");
const {
  listUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getPlatformStats,
  listAllLinks,
  listAllCampaigns,
} = require("../controller/admin.controller");

// Every route here requires a logged-in admin.
router.use(authMiddleware, requireAdmin);

router.get("/stats", getPlatformStats);
router.get("/users", listUsers);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);
router.get("/links", listAllLinks);
router.get("/campaigns", listAllCampaigns);

module.exports = router;
