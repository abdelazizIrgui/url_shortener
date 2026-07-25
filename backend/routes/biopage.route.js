const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const { getMyBioPage, upsertMyBioPage, getPublicBioPage } = require("../controller/biopage.controller");

// Private — manage your own bio page
router.get("/me", authMiddleware, getMyBioPage);
router.put("/me", authMiddleware, upsertMyBioPage);

// Public — anyone can view a published bio page
router.get("/:username", getPublicBioPage);

module.exports = router;
