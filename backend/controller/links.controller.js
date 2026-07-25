const QRCode = require("qrcode");
const Url = require("../model/UrlModel");
const Click = require("../model/ClickModel");
const Campaign = require("../model/CampaignModel");
const User = require("../model/UserModel");

const SLUG_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const generateSlug = (len = 6) => {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)];
  }
  return out;
};

const getBaseUrl = (req) =>
  process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;

const buildShortUrl = (req, code) => `${getBaseUrl(req)}/${code}`;

const FREE_PLAN_LINK_LIMIT = 25;

// ─── Create ──────────────────────────────────────────────────────────────────
const createShortUrl = async (req, res) => {
  try {
    const { url, expiresAt, title, campaignId, variants } = req.body;

    if (!url) return res.status(400).json({ message: "url is required" });

    const user = await User.findById(req.userId);
    if (user && user.plan === "free") {
      const count = await Url.countDocuments({ userId: req.userId });
      if (count >= FREE_PLAN_LINK_LIMIT) {
        return res.status(403).json({
          message: `Free plan is limited to ${FREE_PLAN_LINK_LIMIT} links. Upgrade to Premium for unlimited links.`,
          code: "PLAN_LIMIT_REACHED",
        });
      }
    }

    const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

    let shortCode = generateSlug();
    let attempts = 0;
    while (await Url.findOne({ shortUrl: shortCode })) {
      shortCode = generateSlug();
      if (++attempts > 5) break;
    }

    let expiry = null;
    if (expiresAt) {
      const d = new Date(expiresAt);
      if (isNaN(d.getTime())) return res.status(400).json({ message: "Invalid expiresAt date" });
      if (d.getTime() <= Date.now()) return res.status(400).json({ message: "Expiry date must be in the future" });
      expiry = d;
    }

    let campaign = null;
    if (campaignId) {
      campaign = await Campaign.findOne({ _id: campaignId, userId: req.userId });
      if (!campaign) return res.status(400).json({ message: "Campaign not found" });
    }

    let cleanVariants;
    if (Array.isArray(variants) && variants.length > 0) {
      cleanVariants = variants
        .filter((v) => v && v.url)
        .slice(0, 10)
        .map((v) => ({
          url: /^https?:\/\//i.test(v.url) ? v.url : `https://${v.url}`,
          weight: Math.max(1, Number(v.weight) || 1),
        }));
    }

    const newUrl = await Url.create({
      url: finalUrl,
      shortUrl: shortCode,
      title: title || "",
      userId: req.userId,
      expiresAt: expiry,
      campaignId: campaign ? campaign._id : null,
      variants: cleanVariants || [],
    });

    // Abuse heuristic: flag (not block) accounts creating an unusual burst of
    // links, so a human can review — e.g. 15+ links in the last 10 minutes.
    if (user && !user.flagged) {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentCount = await Url.countDocuments({ userId: req.userId, createdAt: { $gte: tenMinAgo } });
      if (recentCount >= 15) {
        user.flagged = true;
        user.flaggedReason = `Created ${recentCount} links within 10 minutes`;
        await user.save();
        console.warn(`[abuse-flag] user ${req.userId} flagged: ${user.flaggedReason}`);
      }
    }

    return res.status(201).json({ message: "Short URL created", link: formatLink(newUrl, req) });
  } catch (err) {
    console.error("[createShortUrl]", err.message);
    if (err.code === 11000) return res.status(409).json({ message: "Short code collision, please try again" });
    return res.status(500).json({ message: "Error creating short URL" });
  }
};

const formatLink = (doc, req) => ({
  id: doc._id,
  url: doc.url,
  shortCode: doc.shortUrl,
  shortUrl: buildShortUrl(req, doc.shortUrl),
  title: doc.title,
  expiresAt: doc.expiresAt,
  clicksCount: doc.clicksCount,
  createdAt: doc.createdAt,
  isExpired: doc.expiresAt ? new Date(doc.expiresAt).getTime() < Date.now() : false,
  campaignId: doc.campaignId || null,
  variants: (doc.variants || []).map((v) => ({ id: v._id, url: v.url, weight: v.weight, clicks: v.clicks })),
});

// ─── Get all links ───────────────────────────────────────────────────────────
const getMyLinks = async (req, res) => {
  try {
    const links = await Url.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.status(200).json({ links: links.map((l) => formatLink(l, req)) });
  } catch (err) {
    console.error("[getMyLinks]", err.message);
    return res.status(500).json({ message: "Error fetching links" });
  }
};

// ─── Get stats for one link ───────────────────────────────────────────────────
const getLinkStats = async (req, res) => {
  try {
    const link = await Url.findOne({ _id: req.params.id, userId: req.userId });
    if (!link) return res.status(404).json({ message: "Link not found" });

    const clicks = await Click.find({ linkId: link._id }).sort({ createdAt: -1 });

    const tally = (arr, key) => {
      const map = {};
      arr.forEach((c) => {
        const val = c[key] || "Unknown";
        map[val] = (map[val] || 0) + 1;
      });
      return Object.entries(map)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    const DAYS = 14;
    const dayKey = (d) => d.toISOString().slice(0, 10);
    const counts = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      counts[dayKey(d)] = 0;
    }
    clicks.forEach((c) => {
      const key = dayKey(new Date(c.createdAt));
      if (key in counts) counts[key] += 1;
    });
    const clicksOverTime = Object.entries(counts).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count,
    }));

    return res.status(200).json({
      link: formatLink(link, req),
      totalClicks: clicks.length,
      byCountry: tally(clicks, "country"),
      byDevice: tally(clicks, "device"),
      byReferrer: tally(clicks, "referrer"),
      clicksOverTime,
      recentClicks: clicks.slice(0, 25),
    });
  } catch (err) {
    console.error("[getLinkStats]", err.message);
    return res.status(500).json({ message: "Error fetching link stats" });
  }
};

// ─── Update link ─────────────────────────────────────────────────────────────
const updateLink = async (req, res) => {
  try {
    const { url, title, expiresAt, campaignId, variants } = req.body;
    const link = await Url.findOne({ _id: req.params.id, userId: req.userId });
    if (!link) return res.status(404).json({ message: "Link not found" });

    if (url) link.url = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    if (title !== undefined) link.title = title;

    if (expiresAt !== undefined) {
      if (expiresAt === null || expiresAt === "") {
        link.expiresAt = null;
      } else {
        const d = new Date(expiresAt);
        if (isNaN(d.getTime())) return res.status(400).json({ message: "Invalid expiresAt date" });
        link.expiresAt = d;
      }
    }

    if (campaignId !== undefined) {
      if (!campaignId) {
        link.campaignId = null;
      } else {
        const campaign = await Campaign.findOne({ _id: campaignId, userId: req.userId });
        if (!campaign) return res.status(400).json({ message: "Campaign not found" });
        link.campaignId = campaign._id;
      }
    }

    if (variants !== undefined) {
      if (!Array.isArray(variants)) return res.status(400).json({ message: "variants must be an array" });
      link.variants = variants
        .filter((v) => v && v.url)
        .slice(0, 10)
        .map((v) => ({
          url: /^https?:\/\//i.test(v.url) ? v.url : `https://${v.url}`,
          weight: Math.max(1, Number(v.weight) || 1),
        }));
    }

    await link.save();
    return res.status(200).json({ message: "Link updated", link: formatLink(link, req) });
  } catch (err) {
    console.error("[updateLink]", err.message);
    return res.status(500).json({ message: "Error updating link" });
  }
};

// ─── Delete link ─────────────────────────────────────────────────────────────
const deleteLink = async (req, res) => {
  try {
    const link = await Url.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!link) return res.status(404).json({ message: "Link not found" });
    await Click.deleteMany({ linkId: link._id });
    return res.status(200).json({ message: "Link deleted" });
  } catch (err) {
    console.error("[deleteLink]", err.message);
    return res.status(500).json({ message: "Error deleting link" });
  }
};

// ─── QR Code ─────────────────────────────────────────────────────────────────
const getLinkQrCode = async (req, res) => {
  try {
    const link = await Url.findOne({ _id: req.params.id, userId: req.userId });
    if (!link) return res.status(404).json({ message: "Link not found" });

    const shortUrl = buildShortUrl(req, link.shortUrl);
    const dataUrl = await QRCode.toDataURL(shortUrl, {
      width: 320, margin: 2,
      color: { dark: "#0f1115", light: "#ffffff" },
    });

    return res.status(200).json({ qrCode: dataUrl, shortUrl });
  } catch (err) {
    console.error("[getLinkQrCode]", err.message);
    return res.status(500).json({ message: "Error generating QR code" });
  }
};

module.exports = { createShortUrl, getMyLinks, getLinkStats, updateLink, deleteLink, getLinkQrCode };
