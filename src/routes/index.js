const express = require("express");
const router = express.Router();

// Import routes
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const characterRoutes = require("./character.routes");

// Use routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/character", characterRoutes);

module.exports = router;
