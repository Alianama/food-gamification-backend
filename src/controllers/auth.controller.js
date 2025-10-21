// Import handlers
const loginHandler = require("../handlers/auth/login.handler");
const logoutHandler = require("../handlers/auth/logout.handler");
const refreshTokenHandler = require("../handlers/auth/refreshToken.handler");
const changePasswordHandler = require("../handlers/auth/changePassword.handler");
const getProfileHandler = require("../handlers/auth/getProfile.handler");

const authController = {
  login: loginHandler,
  logout: logoutHandler,
  refreshToken: refreshTokenHandler,
  changePassword: changePasswordHandler,
  getProfile: getProfileHandler,
};

module.exports = authController;
