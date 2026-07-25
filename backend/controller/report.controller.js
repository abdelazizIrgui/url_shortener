const Report = require("../model/ReportModel");

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  return forwarded ? forwarded.split(",")[0].trim() : req.socket?.remoteAddress || req.ip || "";
};

// ─── Submit a public abuse report (no auth required) ───────────────────────
const submitReport = async (req, res) => {
  try {
    const { targetType, targetValue, reason } = req.body;

    if (!["bioPage", "shortLink"].includes(targetType))
      return res.status(400).json({ message: "Invalid target type" });
    if (!targetValue || !targetValue.trim())
      return res.status(400).json({ message: "targetValue is required" });
    if (!reason || !reason.trim())
      return res.status(400).json({ message: "Please describe the issue" });
    if (reason.trim().length > 1000)
      return res.status(400).json({ message: "Reason is too long (max 1000 characters)" });

    await Report.create({
      targetType,
      targetValue: targetValue.trim(),
      reason: reason.trim(),
      reporterIp: getClientIp(req),
    });

    return res.status(201).json({ message: "Report submitted" });
  } catch (err) {
    console.error("[submitReport]", err.message);
    return res.status(500).json({ message: "Error submitting report" });
  }
};

module.exports = { submitReport };
