// Auth handlers
const loginHandler = require("./auth/login.handler");
const logoutHandler = require("./auth/logout.handler");
const refreshTokenHandler = require("./auth/refreshToken.handler");
const changePasswordHandler = require("./auth/changePassword.handler");
const getProfileHandler = require("./auth/getProfile.handler");

// User handlers
const getAllUsersHandler = require("./user/getAllUsers.handler");
const getUserByIdHandler = require("./user/getUserById.handler");
const createUserHandler = require("./user/createUser.handler");
const updateUserHandler = require("./user/updateUser.handler");
const deleteUserHandler = require("./user/deleteUser.handler");
const resetPasswordHandler = require("./user/resetPassword.handler");
const changeProfilePictureHandler = require("./user/changeProfilePicture.handler");
const decodeBase64Handler = require("./user/decodeBase64.handler");

module.exports = {
  // Auth handlers
  loginHandler,
  logoutHandler,
  refreshTokenHandler,
  changePasswordHandler,
  getProfileHandler,

  // User handlers
  getAllUsersHandler,
  getUserByIdHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  resetPasswordHandler,
  changeProfilePictureHandler,
  decodeBase64Handler,
};
