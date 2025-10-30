const getAllUsersHandler = require("../handlers/user/getAllUsers.handler");
const getUserByIdHandler = require("../handlers/user/getUserById.handler");
const createUserHandler = require("../handlers/user/createUser.handler");
const updateUserHandler = require("../handlers/user/updateUser.handler");
const deleteUserHandler = require("../handlers/user/deleteUser.handler");
const resetPasswordHandler = require("../handlers/user/resetPassword.handler");
const getOwnProfileHandler = require("../handlers/auth/getProfile.handler");
const changeProfilePictureHandler = require("../handlers/user/changeProfilePicture.handler");
const decodeBase64Handler = require("../handlers/user/decodeBase64.handler");

const userController = {
  getAll: getAllUsersHandler,
  getById: getUserByIdHandler,
  create: createUserHandler,
  createUser: createUserHandler,
  update: updateUserHandler,
  delete: deleteUserHandler,
  deleteUser: deleteUserHandler,
  resetPassword: resetPasswordHandler,
  getOwnProfile: getOwnProfileHandler,
  changeProfilePicture: changeProfilePictureHandler,
  decodeBase64: decodeBase64Handler,
};

module.exports = userController;
