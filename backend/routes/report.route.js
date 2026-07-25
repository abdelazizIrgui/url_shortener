const express = require("express");
const router = express.Router();
const { submitReport } = require("../controller/report.controller");

// Public — anyone (including visitors without an account) can report abuse
router.post("/", submitReport);

module.exports = router;
