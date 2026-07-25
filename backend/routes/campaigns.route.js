const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const {
  createCampaign,
  getMyCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
} = require("../controller/campaigns.controller");

router.use(authMiddleware);

router.post("/", createCampaign);
router.get("/", getMyCampaigns);
router.get("/:id", getCampaignById);
router.patch("/:id", updateCampaign);
router.delete("/:id", deleteCampaign);

module.exports = router;
