/**
 * makeAdmin.js
 * ------------------------------------------------------------------
 * One-time helper script: creates the given account if it doesn't
 * exist yet, or promotes it to admin if it already exists.
 *
 * Usage (from the backend/ folder):
 *   node scripts/makeAdmin.js
 *
 * ADMIN_EMAIL and ADMIN_PASSWORD are REQUIRED (no built-in defaults):
 *   ADMIN_EMAIL=someone@mail.com ADMIN_PASSWORD="a-strong-password-123!" node scripts/makeAdmin.js
 *
 * Requires your existing backend/.env (DB_URL must be set).
 * ------------------------------------------------------------------
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../model/UserModel");

// No hardcoded fallback email/password — both must be supplied explicitly,
// so nobody can accidentally (or knowingly) run this against a real
// deployment with a well-known default credential.
const EMAIL = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.toLowerCase() : null;
const PASSWORD = process.env.ADMIN_PASSWORD || null;
const NAME = process.env.ADMIN_NAME || "Admin";

async function run() {
  if (!process.env.DB_URL) {
    console.error("❌ DB_URL is not set in backend/.env — cannot connect.");
    process.exit(1);
  }

  if (!EMAIL || !PASSWORD) {
    console.error(
      "❌ ADMIN_EMAIL and ADMIN_PASSWORD must both be set explicitly, e.g.:\n" +
      "   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=\"a-strong-password\" node scripts/makeAdmin.js"
    );
    process.exit(1);
  }

  if (PASSWORD.length < 12) {
    console.error("❌ ADMIN_PASSWORD is too short — use at least 12 characters.");
    process.exit(1);
  }

  await mongoose.connect(process.env.DB_URL);
  console.log("Connected to MongoDB ✅");

  let user = await User.findOne({ email: EMAIL });

  if (user) {
    user.role = "admin";
    // Optional: also reset the password to the one provided, in case it was forgotten.
    if (PASSWORD) {
      user.password = await bcrypt.hash(PASSWORD, 10);
    }
    await user.save();
    console.log(`✅ Existing user "${EMAIL}" is now an admin.`);
  } else {
    const hashed = await bcrypt.hash(PASSWORD, 10);
    user = await User.create({
      name: NAME,
      email: EMAIL,
      password: hashed,
      role: "admin",
    });
    console.log(`✅ Created new admin user "${EMAIL}".`);
  }

  await mongoose.disconnect();
  console.log("Done. You can now log in with this email/password and visit /admin/posts.");
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});