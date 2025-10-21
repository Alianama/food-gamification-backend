const foodDetectionHandler = require("../handlers/character/foodDetection.handler");
const getFoodHistoryHandler = require("../handlers/character/getFoodHistory.handler");
const getFoodStatsHandler = require("../handlers/character/getFoodStats.handler");
const foodConfirmHandler = require("../handlers/character/foodConfirm.handler");

const characterController = {
  foodDetection: foodDetectionHandler,
  getFoodHistory: getFoodHistoryHandler,
  getFoodStats: getFoodStatsHandler,
  foodConfirm: foodConfirmHandler,
};

module.exports = characterController;
