const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const {
  createShortUrl,
  getMyLinks,
  getLinkStats,
  updateLink,
  deleteLink,
  getLinkQrCode,
} = require("../controller/links.controller");

router.use(authMiddleware);

router.post("/", createShortUrl);
router.get("/", getMyLinks);
router.get("/:id/stats", getLinkStats);
router.get("/:id/qrcode", getLinkQrCode);
router.put("/:id", updateLink);
router.delete("/:id", deleteLink);

module.exports = router;
