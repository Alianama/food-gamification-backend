const { PrismaClient } = require("@prisma/client");
const xpCalculation = require("../../services/xpCalculation.service");
const healthCalculation = require("../../services/healthCalculation.service");

const prisma = new PrismaClient();

const getFoodStatsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = "30" } = req.query; // days

    const periodDays = parseInt(period);
    if (isNaN(periodDays) || periodDays < 1 || periodDays > 365) {
      return res.status(400).json({
        status: "error",
        message: "Periode tidak valid. Gunakan 1-365 hari.",
        code: "INVALID_PERIOD",
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    console.info("Fetching food statistics", {
      userId,
      periodDays,
      startDate: startDate.toISOString(),
    });

    // Ambil SEMUA riwayat scan (untuk hitungan berapa kali scan)
    const allScannedHistory = await prisma.foodHistory.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        foodName: true,
        isConsumed: true,
        createdAt: true,
      },
    });

    // Hanya makanan yang DIKONSUMSI (fed ke character) yang dihitung nutrisinya
    const consumedHistory = await prisma.foodHistory.findMany({
      where: {
        userId: userId,
        isConsumed: true,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        foodName: true,
        calories: true,
        carbohydrate: true,
        fat: true,
        fiber: true,
        protein: true,
        sodium: true,
        sugar: true,
        createdAt: true,
      },
    });

    const totalScanned = allScannedHistory.length;          // total scan (semua)
    const totalConsumed = consumedHistory.length;           // total dikonsumsi saja
    const totalEntries = totalScanned;                      // untuk backward compat

    // Kalkulasi nutrisi HANYA dari makanan yang dikonsumsi
    const totalCalories = consumedHistory.reduce(
      (sum, food) => sum + (food.calories || 0),
      0
    );
    const totalCarbohydrate = consumedHistory.reduce(
      (sum, food) => sum + (food.carbohydrate || 0),
      0
    );
    const totalFat = consumedHistory.reduce(
      (sum, food) => sum + (food.fat || 0),
      0
    );
    const totalFiber = consumedHistory.reduce(
      (sum, food) => sum + (food.fiber || 0),
      0
    );
    const totalProtein = consumedHistory.reduce(
      (sum, food) => sum + (food.protein || 0),
      0
    );
    const totalSodium = consumedHistory.reduce(
      (sum, food) => sum + (food.sodium || 0),
      0
    );
    const totalSugar = consumedHistory.reduce(
      (sum, food) => sum + (food.sugar || 0),
      0
    );

    // Rata-rata berdasarkan item yang dikonsumsi
    const avgCalories = totalConsumed > 0 ? totalCalories / totalConsumed : 0;
    const avgCarbohydrate = totalConsumed > 0 ? totalCarbohydrate / totalConsumed : 0;
    const avgFat = totalConsumed > 0 ? totalFat / totalConsumed : 0;
    const avgFiber = totalConsumed > 0 ? totalFiber / totalConsumed : 0;
    const avgProtein = totalConsumed > 0 ? totalProtein / totalConsumed : 0;
    const avgSodium = totalConsumed > 0 ? totalSodium / totalConsumed : 0;
    const avgSugar = totalConsumed > 0 ? totalSugar / totalConsumed : 0;

    // mostConsumedFoods: hanya dari yang dikonsumsi
    const foodCounts = {};
    consumedHistory.forEach((food) => {
      foodCounts[food.foodName] = (foodCounts[food.foodName] || 0) + 1;
    });

    const mostConsumedFoods = Object.entries(foodCounts)
      .map(([foodName, count]) => ({ foodName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // dailyBreakdown: gabungan scan + consumed per hari
    const dailyBreakdown = {};
    allScannedHistory.forEach((food) => {
      const date = food.createdAt.toISOString().split("T")[0];
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = {
          date,
          count: 0,
          countConsumed: 0,
          countScannedOnly: 0,
          calories: 0,
          foods: [],
        };
      }
      dailyBreakdown[date].count++;
      if (food.isConsumed) {
        dailyBreakdown[date].countConsumed++;
      } else {
        dailyBreakdown[date].countScannedOnly++;
      }
      dailyBreakdown[date].foods.push(food.foodName);
    });

    // Tambahkan kalori dari yang dikonsumsi saja
    consumedHistory.forEach((food) => {
      const date = food.createdAt.toISOString().split("T")[0];
      if (dailyBreakdown[date]) {
        dailyBreakdown[date].calories += food.calories || 0;
      }
    });

    const dailyStats = Object.values(dailyBreakdown).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    console.info("Food statistics calculated successfully", {
      userId,
      totalEntries,
      periodDays,
    });

    const character = await prisma.character.findUnique({
      where: { userId: userId },
      select: {
        id: true,
        level: true,
        statusName: true,
        healthPoint: true,
        xpToNextLevel: true,
        xpPoint: true,
        statusName: true,
      },
    });

    // Health score and recommendations over last 7 days (consumed foods only)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyConsumed = await prisma.foodHistory.findMany({
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

    const dailyNutrition = {};
    weeklyConsumed.forEach((food) => {
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

    // Today's totals for nutrition recommendations
    const todayStr = new Date().toISOString().split("T")[0];
    const todayTotals = dailyNutrition[todayStr] || {
      calories: 0,
      protein: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };

    const nutrition = {
      calories: todayTotals.calories || 0,
      protein: todayTotals.protein || 0,
      fiber: todayTotals.fiber || 0,
      sugar: todayTotals.sugar || 0,
      sodium: todayTotals.sodium || 0,
    };

    return res.status(200).json({
      status: "success",
      message: "Statistik makanan berhasil diambil",
      data: {
        period: {
          days: periodDays,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
        summary: {
          totalEntries,         // total semua scan
          totalScanned,         // alias totalEntries
          totalConsumed,        // hanya yang dikonsumsi (fed ke character)
          totalCalories: Math.round(totalCalories * 100) / 100,
          totalCarbohydrate: Math.round(totalCarbohydrate * 100) / 100,
          totalFat: Math.round(totalFat * 100) / 100,
          totalFiber: Math.round(totalFiber * 100) / 100,
          totalProtein: Math.round(totalProtein * 100) / 100,
          totalSodium: Math.round(totalSodium * 100) / 100,
          totalSugar: Math.round(totalSugar * 100) / 100,
        },
        averages: {
          calories: Math.round(avgCalories * 100) / 100,
          carbohydrate: Math.round(avgCarbohydrate * 100) / 100,
          fat: Math.round(avgFat * 100) / 100,
          fiber: Math.round(avgFiber * 100) / 100,
          protein: Math.round(avgProtein * 100) / 100,
          sodium: Math.round(avgSodium * 100) / 100,
          sugar: Math.round(avgSugar * 100) / 100,
        },
        nutritionRecommendations:
          xpCalculation.getNutritionRecommendations(nutrition),
        healthRecommendations: healthCalculation.getHealthRecommendations(
          healthResult.weeklyScore,
          (healthResult.dailyScores &&
            healthResult.dailyScores[healthResult.dailyScores.length - 1] &&
            healthResult.dailyScores[healthResult.dailyScores.length - 1]
              .breakdown) ||
            {}
        ),
        health: {
          weeklyScore: healthResult.weeklyScore,
          status: healthResult.status,
        },
        character,
        mostConsumedFoods,
        dailyBreakdown: dailyStats,
      },
    });
  } catch (error) {
    console.error("Error fetching food statistics", {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat mengambil statistik makanan",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
};

module.exports = getFoodStatsHandler;
