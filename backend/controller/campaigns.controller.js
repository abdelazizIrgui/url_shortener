const Campaign = require("../model/CampaignModel");
const Url = require("../model/UrlModel");

// إنشاء حملة جديدة
const createCampaign = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Campaign name is required" });
    }
    const campaign = await Campaign.create({
      name: name.trim(),
      description: description || "",
      userId: req.userId,
    });
    res.status(201).json({ campaign });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating campaign" });
  }
};

// جلب كل حملات المستخدم مع عدد الروابط وإجمالي النقرات لكل حملة
const getMyCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.userId }).sort({ createdAt: -1 });

    const withStats = await Promise.all(
      campaigns.map(async (c) => {
        const links = await Url.find({ campaignId: c._id, userId: req.userId });
        const totalClicks = links.reduce((sum, l) => sum + (l.clicksCount || 0), 0);
        return {
          id: c._id,
          name: c.name,
          description: c.description,
          createdAt: c.createdAt,
          linksCount: links.length,
          totalClicks,
        };
      })
    );

    res.status(200).json({ campaigns: withStats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching campaigns" });
  }
};

// جلب حملة واحدة مع روابطها
const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.userId });
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    const links = await Url.find({ campaignId: campaign._id, userId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json({ campaign, links });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching campaign" });
  }
};

// تعديل حملة
const updateCampaign = async (req, res) => {
  try {
    const { name, description } = req.body;
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.userId });
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (name !== undefined) campaign.name = name.trim();
    if (description !== undefined) campaign.description = description;
    await campaign.save();
    res.status(200).json({ campaign });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating campaign" });
  }
};

// حذف حملة (الروابط المرتبطة بها تبقى موجودة، فقط يُفصل ربطها)
const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    await Url.updateMany({ campaignId: campaign._id }, { $set: { campaignId: null } });
    res.status(200).json({ message: "Campaign deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting campaign" });
  }
};

module.exports = {
  createCampaign,
  getMyCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
};
