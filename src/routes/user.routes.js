const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { verifyToken } = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");
const {
  createUserValidator,
  updateUserValidator,
  resetPasswordValidator,
  getUserByIdValidator,
  deleteUserValidator,
} = require("../validators/user.validator");

router.get(
  "/",
  checkPermission("MANAGE_USERS"),
  verifyToken,
  userController.getAll
);
router.get("/me", userController.getOwnProfile);
router.get(
  "/:id",
  checkPermission("MANAGE_USERS"),
  verifyToken,
  getUserByIdValidator,
  userController.getById
);
router.post("/add", createUserValidator, userController.createUser);
router.put(
  "/:id",
  checkPermission("MANAGE_USERS"),
  verifyToken,
  updateUserValidator,
  userController.update
);
router.put(
  "/:id/reset-password",
  checkPermission("MANAGE_USERS"),
  verifyToken,
  resetPasswordValidator,
  userController.resetPassword
);
router.delete(
  "/:id",
  checkPermission("MANAGE_USERS"),
  verifyToken,
  deleteUserValidator,
  userController.delete
);

module.exports = router;
