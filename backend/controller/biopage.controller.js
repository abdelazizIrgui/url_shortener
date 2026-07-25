const BioPage = require("../model/BioPageModel");
const User = require("../model/UserModel");

const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/;

// Bio pages are now served at the site root (e.g. yourdomain.com/username),
// so a generated username must never exactly match a real app route.
// (In practice a 4-char random slug landing on one of these is astronomically
// unlikely, but we check defensively since the cost is free.)
const RESERVED_USERNAMES = new Set([
  "login", "logout", "register", "signup", "forgot-password", "reset-password",
  "dashboard", "profile", "campaigns", "bio-editor", "about", "contact",
  "blog", "privacy", "terms", "cookies", "accessibility", "admin",
  "not-found", "health", "api", "assets", "static", "favicon.svg",
]);

// Generate a short random slug, e.g. "a1b2" — lowercase letters + digits only.
const SLUG_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const randomSlug = (length) => {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)];
  }
  return out;
};

// Generate unique short username, e.g. "a1b2" (4 chars).
// Starts at 4 chars; if collisions keep happening (pool getting crowded),
// widens the length rather than looping forever.
const generateUsername = async () => {
  let length = 4;
  let attempts = 0;
  while (attempts < 20) {
    const candidate = randomSlug(length);
    const exists = RESERVED_USERNAMES.has(candidate) || (await BioPage.findOne({ username: candidate }));
    if (!exists) return candidate;
    attempts++;
    if (attempts % 5 === 0) length++; // widen the pool every 5 misses
  }
  // Extreme fallback — practically unreachable
  return `${randomSlug(6)}${Date.now().toString().slice(-4)}`;
};

const sanitizePublic = (page) => ({
  username: page.username,
  displayName: page.displayName,
  bio: page.bio,
  avatarBase64: page.avatarBase64 || "",
  coverImageBase64: page.coverImageBase64 || "",
  theme: page.theme,
  links: page.links
    .filter((l) => l.url)
    .map((l) => ({ id: l._id, label: l.label, url: l.url, icon: l.icon })),
});

// ─── GET /api/bio/me ──────────────────────────────────────────────────────────
// Returns current user's bio page, or auto-creates one with a generated username
// and copies the user's profile avatar into the bio page automatically.
const getMyBioPage = async (req, res) => {
  try {
    let page = await BioPage.findOne({ userId: req.userId });

    // First time: auto-create with generated username + copy profile avatar
    if (!page) {
      const user = await User.findById(req.userId);
      const generatedUsername = await generateUsername();

      page = await BioPage.create({
        userId: req.userId,
        username: generatedUsername,
        displayName: user?.name || "",
        // ← Copy profile photo automatically so bio page starts with user's avatar
        avatarBase64: user?.avatarBase64 || "",
        bio: "",
        theme: "default",
        isPublished: true,
        links: [],
      });
    } else if (!page.avatarBase64) {
      // Bio page exists but has no avatar yet — sync from profile if available
      const user = await User.findById(req.userId);
      if (user?.avatarBase64) {
        page.avatarBase64 = user.avatarBase64;
        await page.save();
      }
    }

    return res.status(200).json({ bioPage: page });
  } catch (err) {
    console.error("[getMyBioPage]", err.message);
    return res.status(500).json({ message: "Error fetching bio page" });
  }
};

// ─── PUT /api/bio/me ──────────────────────────────────────────────────────────
// Update bio page — username is READ-ONLY after creation (cannot be changed)
const upsertMyBioPage = async (req, res) => {
  try {
    const { displayName, bio, avatarBase64, coverImageBase64, theme, isPublished, links } = req.body;

    // Validate avatar size (~750KB limit)
    if (avatarBase64 !== undefined && avatarBase64 !== "" && avatarBase64.length > 1_000_000)
      return res.status(400).json({ message: "Profile photo is too large (max ~750 KB)" });

    // Cover images are wider, so allow a bit more headroom (~1.3MB limit)
    if (coverImageBase64 !== undefined && coverImageBase64 !== "" && coverImageBase64.length > 1_800_000)
      return res.status(400).json({ message: "Cover photo is too large (max ~1.3 MB)" });

    if (links && (!Array.isArray(links) || links.length > 30))
      return res.status(400).json({ message: "links must be an array of up to 30 items" });

    const cleanLinks = Array.isArray(links)
      ? links
          .filter((l) => l && l.label && l.url)
          .map((l) => ({
            label: String(l.label).slice(0, 60),
            url: /^https?:\/\//i.test(l.url) ? l.url : `https://${l.url}`,
            icon: l.icon || "",
          }))
      : undefined;

    let page = await BioPage.findOne({ userId: req.userId });

    if (!page) {
      // Shouldn't happen (getMyBioPage auto-creates), but handle it
      const generatedUsername = await generateUsername();
      page = new BioPage({
        userId: req.userId,
        username: generatedUsername,
        links: cleanLinks || [],
      });
    } else {
      // username is intentionally NOT updated here — it's permanent
      if (cleanLinks) {
        page.links = cleanLinks;

        // Remember every link ever added, even ones removed later, so the
        // editor can offer "add it back" shortcuts. Newest first, deduped
        // by URL, capped at 20 so this can't grow forever.
        const existingHistory = page.linkHistory || [];
        const merged = [...cleanLinks, ...existingHistory];
        const seenUrls = new Set();
        page.linkHistory = merged
          .filter((l) => {
            if (seenUrls.has(l.url)) return false;
            seenUrls.add(l.url);
            return true;
          })
          .slice(0, 20);
      }
    }

    if (displayName !== undefined) page.displayName = String(displayName).slice(0, 60);
    if (bio !== undefined) page.bio = String(bio).slice(0, 280);
    if (avatarBase64 !== undefined) page.avatarBase64 = avatarBase64;
    if (coverImageBase64 !== undefined) page.coverImageBase64 = coverImageBase64;
    if (theme !== undefined) page.theme = theme;
    if (isPublished !== undefined) page.isPublished = !!isPublished;

    await page.save();
    return res.status(200).json({ bioPage: page });
  } catch (err) {
    console.error("[upsertMyBioPage]", err.message);
    if (err.code === 11000)
      return res.status(409).json({ message: "Username conflict, please contact support" });
    return res.status(500).json({ message: "Error saving bio page" });
  }
};

// ─── GET /api/bio/:username (public) ─────────────────────────────────────────
const getPublicBioPage = async (req, res) => {
  try {
    const username = (req.params.username || "").trim().toLowerCase();
    const page = await BioPage.findOne({ username, isPublished: true });
    if (!page) return res.status(404).json({ message: "Page not found" });
    return res.status(200).json({ bioPage: sanitizePublic(page) });
  } catch (err) {
    console.error("[getPublicBioPage]", err.message);
    return res.status(500).json({ message: "Error fetching page" });
  }
};

module.exports = { getMyBioPage, upsertMyBioPage, getPublicBioPage };
