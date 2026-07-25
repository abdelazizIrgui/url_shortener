const User = require("../model/UserModel");

// Must run AFTER authMiddleware (needs req.userId already set).
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("role");
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch {
    return res.status(500).json({ message: "Error checking permissions" });
  }
};

module.exports = requireAdmin;
