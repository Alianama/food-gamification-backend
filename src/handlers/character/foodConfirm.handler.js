const { PrismaClient } = require("@prisma/client");
const xpCalculation = require("../../services/xpCalculation.service");
const healthCalculation = require("../../services/healthCalculation.service");

const prisma = new PrismaClient();

const foodConfirmHandler = async (req, res) => {
  try {
    const { foodHistoryId, confirm } = req.body;
    const userId = req.user.id;

    // Validasi input
    if (!foodHistoryId || typeof confirm !== "boolean") {
      return res.status(400).json({
        status: "error",
        message: "foodHistoryId dan confirm (boolean) diperlukan",
        code: "INVALID_INPUT",
      });
    }

    console.info("Food confirmation request", {
      userId,
      foodHistoryId,
      confirm,
    });

    // Cari food history record
    const foodHistory = await prisma.foodHistory.findFirst({
      where: {
        id: foodHistoryId,
        userId: userId,
      },
    });

    if (!foodHistory) {
      return res.status(404).json({
        status: "error",
        message: "Riwayat makanan tidak ditemukan",
        code: "FOOD_HISTORY_NOT_FOUND",
      });
    }

    if (foodHistory.isConsumed) {
      return res.status(400).json({
        status: "error",
        message: "Makanan ini sudah dikonfirmasi sebelumnya",
        code: "ALREADY_CONSUMED",
      });
    }

    let result = {
      foodHistoryId,
      confirmed: confirm,
      xpGained: 0,
      levelUp: false,
      newLevel: 0,
      healthScore: 0,
      healthStatus: "No Data",
    };

    if (confirm) {
      // Hitung XP dari nutrisi
      const nutrition = {
        calories: foodHistory.calories || 0,
        protein: foodHistory.protein || 0,
        fiber: foodHistory.fiber || 0,
        sugar: foodHistory.sugar || 0,
        sodium: foodHistory.sodium || 0,
      };

      const xpResult = xpCalculation.calculateXP(nutrition);
      const xpGained = xpResult.xpGained;

      // Ambil data character saat ini
      const character = await prisma.character.findUnique({
        where: { userId: userId },
      });

      if (!character) {
        return res.status(404).json({
          status: "error",
          message: "Character tidak ditemukan",
          code: "CHARACTER_NOT_FOUND",
        });
      }

      // Hitung level up
      const levelUpResult = xpCalculation.calculateLevelUp(
        character.xpPoint,
        xpGained,
        character.level,
        character.xpToNextLevel
      );

      // Update character
      const updatedCharacter = await prisma.character.update({
        where: { userId: userId },
        data: {
          xpPoint: levelUpResult.newXP,
          level: levelUpResult.newLevel,
          xpToNextLevel: levelUpResult.newXPToNext,
        },
      });

      // Update food history
      await prisma.foodHistory.update({
        where: { id: foodHistoryId },
        data: {
          isConsumed: true,
          consumedAt: new Date(),
          xpGained: xpGained,
        },
      });

      // Hitung health score mingguan
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const weeklyFoodHistory = await prisma.foodHistory.findMany({
        where: {
          userId: userId,
          isConsumed: true,
          consumedAt: {
            gte: sevenDaysAgo,
          },
        },
        select: {
          calories: true,
          protein: true,
          fiber: true,
          sugar: true,
          sodium: true,
          fat: true,
          consumedAt: true,
        },
      });

      // Group by date dan hitung total harian
      const dailyNutrition = {};
      weeklyFoodHistory.forEach((food) => {
        const date = food.consumedAt.toISOString().split("T")[0];
        if (!dailyNutrition[date]) {
          dailyNutrition[date] = {
            date,
            calories: 0,
            protein: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
            fat: 0,
          };
        }
        dailyNutrition[date].calories += food.calories || 0;
        dailyNutrition[date].protein += food.protein || 0;
        dailyNutrition[date].fiber += food.fiber || 0;
        dailyNutrition[date].sugar += food.sugar || 0;
        dailyNutrition[date].sodium += food.sodium || 0;
        dailyNutrition[date].fat += food.fat || 0;
      });

      const weeklyData = Object.values(dailyNutrition);
      const healthResult =
        healthCalculation.calculateWeeklyHealthScore(weeklyData);

      // Update health score di character
      await prisma.character.update({
        where: { userId: userId },
        data: {
          healthPoint: healthResult.weeklyScore,
          statusName: healthResult.status,
        },
      });

      // Dapatkan info level
      const levelInfo = xpCalculation.getLevelInfo(levelUpResult.newLevel);
      const healthStatusInfo = healthCalculation.getHealthStatusInfo(
        healthResult.status
      );

      result = {
        foodHistoryId,
        confirmed: true,
        xpGained,
        levelUp: levelUpResult.levelUp,
        newLevel: levelUpResult.newLevel,
        levelsGained: levelUpResult.levelsGained,
        levelInfo,
        healthScore: healthResult.weeklyScore,
        healthStatus: healthResult.status,
        healthStatusInfo,
        xpBreakdown: xpResult.breakdown,
        nutritionRecommendations:
          xpCalculation.getNutritionRecommendations(nutrition),
        healthRecommendations: healthCalculation.getHealthRecommendations(
          healthResult.weeklyScore,
          healthResult.dailyScores[healthResult.dailyScores.length - 1]
            ?.breakdown || {}
        ),
        character: {
          xpPoint: updatedCharacter.xpPoint,
          level: updatedCharacter.level,
          xpToNextLevel: updatedCharacter.xpToNextLevel,
          healthPoint: healthResult.weeklyScore,
          statusName: healthResult.status,
        },
      };

      console.info("Food confirmed and character updated", {
        userId,
        foodHistoryId,
        xpGained,
        newLevel: levelUpResult.newLevel,
        levelUp: levelUpResult.levelUp,
        healthScore: healthResult.weeklyScore,
        healthStatus: healthResult.status,
      });
    } else {
      // User membatalkan, tidak perlu update apa-apa
      console.info("Food confirmation cancelled", {
        userId,
        foodHistoryId,
      });
    }

    return res.status(200).json({
      status: "success",
      message: confirm
        ? "Makanan berhasil dikonfirmasi!"
        : "Konfirmasi dibatalkan",
      data: result,
    });
  } catch (error) {
    console.error("Error in food confirmation", {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat konfirmasi makanan",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
};

module.exports = foodConfirmHandler;
