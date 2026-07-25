const User = require("../model/UserModel");
const Url = require("../model/UrlModel");
const Click = require("../model/ClickModel");
const Campaign = require("../model/CampaignModel");
const BioPage = require("../model/BioPageModel");
const RefreshToken = require("../model/RefreshTokenModel");
const { revokeAllUserRefreshTokens } = require("../utils/tokens");

const formatUser = (user, linkCount = 0) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  plan: user.plan,
  role: user.role || "user",
  status: user.status || "active",
  avatarBase64: user.avatarBase64 || "",
  flagged: !!user.flagged,
  flaggedReason: user.flaggedReason || "",
  linkCount,
  createdAt: user.createdAt,
});

// ─── List users (search + pagination) ────────────────────────────────────────
const listUsers = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 20, role = "", plan = "", sort = "newest" } = req.query;
    const filter = {};
    if (search && search.trim()) {
      const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: re }, { email: re }];
    }
    if (role && ["user", "admin"].includes(role)) filter.role = role;
    if (plan && ["free", "premium"].includes(plan)) filter.plan = plan;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const sortSpec = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, nameAsc: { name: 1 } }[sort]
      || { createdAt: -1 };

    const [users, total] = await Promise.all([
      User.find(filter).sort(sortSpec).skip(skip).limit(limitNum),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((u) => u._id);
    const counts = await Url.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    return res.json({
      users: users.map((u) => formatUser(u, countMap.get(String(u._id)) || 0)),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("[listUsers]", err.message);
    return res.status(500).json({ message: "Error loading users" });
  }
};

// ─── Suspend / activate a user ────────────────────────────────────────────────
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "suspended"].includes(status))
      return res.status(400).json({ message: "status must be 'active' or 'suspended'" });

    if (String(req.params.id) === String(req.userId))
      return res.status(400).json({ message: "You can't change your own account status" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = status;
    await user.save();

    // Suspending should end any active sessions immediately.
    if (status === "suspended") await revokeAllUserRefreshTokens(user._id);

    return res.json({ message: "User status updated", user: formatUser(user) });
  } catch (err) {
    console.error("[updateUserStatus]", err.message);
    return res.status(500).json({ message: "Error updating user status" });
  }
};

// ─── Promote / demote admin role ─────────────────────────────────────────────
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role))
      return res.status(400).json({ message: "role must be 'user' or 'admin'" });

    if (String(req.params.id) === String(req.userId))
      return res.status(400).json({ message: "You can't change your own role" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();

    return res.json({ message: "User role updated", user: formatUser(user) });
  } catch (err) {
    console.error("[updateUserRole]", err.message);
    return res.status(500).json({ message: "Error updating user role" });
  }
};

// ─── Delete a user + cascade all owned data ──────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.userId))
      return res.status(400).json({ message: "You can't delete your own account from here" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const links = await Url.find({ userId: user._id }).select("_id");
    const linkIds = links.map((l) => l._id);

    await Promise.all([
      Click.deleteMany({ linkId: { $in: linkIds } }),
      Url.deleteMany({ userId: user._id }),
      Campaign.deleteMany({ userId: user._id }),
      BioPage.deleteOne({ userId: user._id }),
      RefreshToken.deleteMany({ userId: user._id }),
    ]);

    await User.deleteOne({ _id: user._id });

    return res.json({ message: "User deleted" });
  } catch (err) {
    console.error("[deleteUser]", err.message);
    return res.status(500).json({ message: "Error deleting user" });
  }
};

// ─── Platform-wide stats ─────────────────────────────────────────────────────
const getPlatformStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      premiumUsers,
      totalAdmins,
      newUsers7d,
      totalLinks,
      totalCampaigns,
      totalBioPages,
      clicksAgg,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ plan: "premium" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Url.countDocuments({}),
      Campaign.countDocuments({}),
      BioPage.countDocuments({}),
      Url.aggregate([{ $group: { _id: null, total: { $sum: "$clicksCount" } } }]),
    ]);

    const totalClicks = clicksAgg[0]?.total || 0;

    // 14-day new-signups sparkline — mirrors the per-link clicksOverTime chart.
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
    const recentUsers = await User.find({ createdAt: { $gte: new Date(today.getTime() - (DAYS - 1) * 86400000) } }).select("createdAt");
    recentUsers.forEach((u) => {
      const key = dayKey(new Date(u.createdAt));
      if (key in counts) counts[key] += 1;
    });
    const signupsOverTime = Object.entries(counts).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count,
    }));

    return res.json({
      totalUsers,
      premiumUsers,
      totalAdmins,
      newUsers7d,
      totalLinks,
      totalCampaigns,
      totalBioPages,
      totalClicks,
      signupsOverTime,
    });
  } catch (err) {
    console.error("[getPlatformStats]", err.message);
    return res.status(500).json({ message: "Error loading platform stats" });
  }
};

// ─── List all links platform-wide (with owner info) ──────────────────────────
// Powers the "Total links" and "Total clicks" stat-card drilldowns.
// sort=clicks lets the clicks card show the top links by clicks first.
const listAllLinks = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 20, sort = "recent" } = req.query;
    const filter = {};
    if (search && search.trim()) {
      const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: re }, { shortUrl: re }, { url: re }];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;
    const sortSpec = sort === "clicks" ? { clicksCount: -1 } : { createdAt: -1 };

    const [links, total] = await Promise.all([
      Url.find(filter).sort(sortSpec).skip(skip).limit(limitNum).populate("userId", "name email"),
      Url.countDocuments(filter),
    ]);

    return res.json({
      links: links.map((l) => ({
        id: l._id,
        title: l.title,
        url: l.url,
        shortUrl: l.shortUrl,
        clicksCount: l.clicksCount,
        createdAt: l.createdAt,
        owner: l.userId ? { id: l.userId._id, name: l.userId.name, email: l.userId.email } : null,
      })),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("[listAllLinks]", err.message);
    return res.status(500).json({ message: "Error loading links" });
  }
};

// ─── List all campaigns platform-wide (with owner info) ──────────────────────
// Powers the "Campaigns" stat-card drilldown.
const listAllCampaigns = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search && search.trim()) {
      const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: re }, { description: re }];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).populate("userId", "name email"),
      Campaign.countDocuments(filter),
    ]);

    const campaignIds = campaigns.map((c) => c._id);
    const linkCounts = await Url.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      { $group: { _id: "$campaignId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(linkCounts.map((c) => [String(c._id), c.count]));

    return res.json({
      campaigns: campaigns.map((c) => ({
        id: c._id,
        name: c.name,
        description: c.description,
        createdAt: c.createdAt,
        linkCount: countMap.get(String(c._id)) || 0,
        owner: c.userId ? { id: c.userId._id, name: c.userId.name, email: c.userId.email } : null,
      })),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("[listAllCampaigns]", err.message);
    return res.status(500).json({ message: "Error loading campaigns" });
  }
};

module.exports = {
  listUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getPlatformStats,
  listAllLinks,
  listAllCampaigns,
};
