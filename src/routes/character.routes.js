const express = require("express");
const router = express.Router();
const characterController = require("../controllers/character.controller");
const { verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.post(
  "/food-detection",
  verifyToken,
  upload.single("image"),
  characterController.foodDetection
);

router.get("/food-history", verifyToken, characterController.getFoodHistory);
router.get("/food-stats", verifyToken, characterController.getFoodStats);
router.post("/food-confirm", verifyToken, characterController.foodConfirm);

module.exports = router;
