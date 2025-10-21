/**
 * Health Score Calculation Service
 * Menghitung skor kesehatan berdasarkan riwayat konsumsi makanan 7 hari terakhir
 */

/**
 * Menghitung skor kesehatan harian berdasarkan total nutrisi
 * @param {Object} dailyNutrition - Total nutrisi harian
 * @returns {Object} - { score, breakdown, status }
 */
const calculateDailyHealthScore = (dailyNutrition) => {
  const {
    calories = 0,
    protein = 0,
    fiber = 0,
    sugar = 0,
    sodium = 0,
    fat = 0,
  } = dailyNutrition;

  // Target nutrisi harian
  const TARGET_CALORIES = 2000;
  const TARGET_CALORIES_TOLERANCE = 0.1; // ±10%
  const TARGET_CALORIES_MIN = TARGET_CALORIES * (1 - TARGET_CALORIES_TOLERANCE); // 1800
  const TARGET_CALORIES_MAX = TARGET_CALORIES * (1 + TARGET_CALORIES_TOLERANCE); // 2200

  const TARGET_PROTEIN = 60; // gram
  const TARGET_FIBER = 25; // gram
  const TARGET_SUGAR = 50; // gram
  const TARGET_SODIUM = 2300; // mg
  const TARGET_FAT = 70; // gram

  let totalScore = 0;
  const breakdown = {
    calories: {
      score: 0,
      weight: 40,
      target: TARGET_CALORIES,
      actual: calories,
    },
    protein: { score: 0, weight: 20, target: TARGET_PROTEIN, actual: protein },
    fiber: { score: 0, weight: 10, target: TARGET_FIBER, actual: fiber },
    sugar: { score: 0, weight: 10, target: TARGET_SUGAR, actual: sugar },
    sodium: { score: 0, weight: 10, target: TARGET_SODIUM, actual: sodium },
    fat: { score: 0, weight: 10, target: TARGET_FAT, actual: fat },
  };

  // 1. Kalori (bobot 40)
  if (calories >= TARGET_CALORIES_MIN && calories <= TARGET_CALORIES_MAX) {
    breakdown.calories.score = 40; // Perfect range
  } else {
    const deviation = Math.max(
      Math.abs(calories - TARGET_CALORIES) -
        TARGET_CALORIES * TARGET_CALORIES_TOLERANCE,
      0
    );
    const penalty = Math.floor(deviation / 50); // 1 point per 50 kcal deviation
    breakdown.calories.score = Math.max(0, 40 - penalty);
  }

  // 2. Protein (bobot 20)
  if (protein >= TARGET_PROTEIN) {
    breakdown.protein.score = 20; // ≥60g
  } else if (protein >= 40) {
    breakdown.protein.score = 10; // 40-59g
  } else {
    breakdown.protein.score = 0; // <40g
  }

  // 3. Serat (bobot 10)
  if (fiber >= TARGET_FIBER) {
    breakdown.fiber.score = 10; // ≥25g
  } else if (fiber >= 15) {
    breakdown.fiber.score = 5; // 15-24g
  } else {
    breakdown.fiber.score = 0; // <15g
  }

  // 4. Gula (bobot 10) - semakin rendah semakin baik
  if (sugar <= TARGET_SUGAR) {
    breakdown.sugar.score = 10; // ≤50g
  } else if (sugar <= 80) {
    breakdown.sugar.score = 5; // 51-80g
  } else {
    breakdown.sugar.score = 0; // >80g
  }

  // 5. Natrium (bobot 10) - semakin rendah semakin baik
  if (sodium <= TARGET_SODIUM) {
    breakdown.sodium.score = 10; // ≤2300mg
  } else if (sodium <= 3000) {
    breakdown.sodium.score = 5; // 2301-3000mg
  } else {
    breakdown.sodium.score = 0; // >3000mg
  }

  // 6. Lemak (bobot 10)
  if (fat <= TARGET_FAT) {
    breakdown.fat.score = 10; // ≤70g
  } else if (fat <= 100) {
    breakdown.fat.score = 5; // 71-100g
  } else {
    breakdown.fat.score = 0; // >100g
  }

  // Hitung total skor
  totalScore = Object.values(breakdown).reduce(
    (sum, item) => sum + item.score,
    0
  );

  // Tentukan status kesehatan
  let status;
  if (totalScore >= 75) {
    status = "Healthy";
  } else if (totalScore >= 50) {
    status = "Neutral";
  } else {
    status = "Unhealthy";
  }

  return {
    score: Math.round(totalScore),
    breakdown,
    status,
    maxScore: 100,
  };
};

/**
 * Menghitung skor kesehatan mingguan berdasarkan data 7 hari
 * @param {Array} weeklyData - Array data harian selama 7 hari
 * @returns {Object} - { weeklyScore, dailyScores, status, trends }
 */
const calculateWeeklyHealthScore = (weeklyData) => {
  if (!weeklyData || weeklyData.length === 0) {
    return {
      weeklyScore: 0,
      dailyScores: [],
      status: "No Data",
      trends: {
        improving: false,
        declining: false,
        stable: true,
      },
    };
  }

  const dailyScores = [];
  let totalScore = 0;
  let validDays = 0;

  // Hitung skor untuk setiap hari
  weeklyData.forEach((dayData, index) => {
    const dailyScore = calculateDailyHealthScore(dayData);
    dailyScores.push({
      date: dayData.date,
      score: dailyScore.score,
      status: dailyScore.status,
      breakdown: dailyScore.breakdown,
    });

    if (dailyScore.score > 0) {
      totalScore += dailyScore.score;
      validDays++;
    }
  });

  // Hitung rata-rata skor mingguan
  const weeklyScore = validDays > 0 ? Math.round(totalScore / validDays) : 0;

  // Tentukan status mingguan
  let status;
  if (weeklyScore >= 75) {
    status = "Healthy";
  } else if (weeklyScore >= 50) {
    status = "Neutral";
  } else {
    status = "Unhealthy";
  }

  // Analisis trend (bandingkan 3 hari terakhir dengan 3 hari sebelumnya)
  const trends = analyzeTrends(dailyScores);

  return {
    weeklyScore,
    dailyScores,
    status,
    trends,
    validDays,
    totalDays: weeklyData.length,
  };
};

/**
 * Menganalisis trend kesehatan
 * @param {Array} dailyScores - Array skor harian
 * @returns {Object} - { improving, declining, stable, trendScore }
 */
const analyzeTrends = (dailyScores) => {
  if (dailyScores.length < 6) {
    return {
      improving: false,
      declining: false,
      stable: true,
      trendScore: 0,
    };
  }

  // Ambil 3 hari terakhir dan 3 hari sebelumnya
  const recentDays = dailyScores.slice(-3);
  const previousDays = dailyScores.slice(-6, -3);

  const recentAvg =
    recentDays.reduce((sum, day) => sum + day.score, 0) / recentDays.length;
  const previousAvg =
    previousDays.reduce((sum, day) => sum + day.score, 0) / previousDays.length;

  const trendScore = recentAvg - previousAvg;
  const threshold = 5; // Minimal 5 poin perbedaan untuk dianggap signifikan

  return {
    improving: trendScore > threshold,
    declining: trendScore < -threshold,
    stable: Math.abs(trendScore) <= threshold,
    trendScore: Math.round(trendScore),
  };
};

/**
 * Mendapatkan rekomendasi kesehatan berdasarkan skor
 * @param {number} score - Skor kesehatan (0-100)
 * @param {Object} breakdown - Breakdown skor per nutrisi
 * @returns {Array} - Array rekomendasi
 */
const getHealthRecommendations = (score, breakdown) => {
  const recommendations = [];

  if (score >= 75) {
    recommendations.push("Excellent! Pertahankan pola makan sehat Anda.");
  } else if (score >= 50) {
    recommendations.push(
      "Good progress! Ada beberapa area yang bisa diperbaiki."
    );
  } else {
    recommendations.push("Perlu perbaikan signifikan dalam pola makan.");
  }

  // Rekomendasi spesifik berdasarkan breakdown
  if (breakdown.calories.score < 30) {
    recommendations.push(
      "Perhatikan asupan kalori harian. Target: 1800-2200 kcal."
    );
  }

  if (breakdown.protein.score < 15) {
    recommendations.push(
      "Tingkatkan asupan protein dengan daging, ikan, atau kacang-kacangan."
    );
  }

  if (breakdown.fiber.score < 7) {
    recommendations.push(
      "Tambahkan lebih banyak sayuran dan buah-buahan untuk serat."
    );
  }

  if (breakdown.sugar.score < 7) {
    recommendations.push("Kurangi makanan dan minuman manis.");
  }

  if (breakdown.sodium.score < 7) {
    recommendations.push("Kurangi garam dan makanan olahan tinggi natrium.");
  }

  if (breakdown.fat.score < 7) {
    recommendations.push(
      "Pilih lemak sehat dan kurangi makanan berlemak tinggi."
    );
  }

  return recommendations;
};

/**
 * Mendapatkan status kesehatan dengan emoji dan warna
 * @param {string} status - Status kesehatan
 * @returns {Object} - { emoji, color, message }
 */
const getHealthStatusInfo = (status) => {
  switch (status) {
    case "Healthy":
      return {
        emoji: "💚",
        color: "#32CD32",
        message: "Sangat Sehat!",
      };
    case "Neutral":
      return {
        emoji: "💛",
        color: "#FFD700",
        message: "Cukup Baik",
      };
    case "Unhealthy":
      return {
        emoji: "❤️",
        color: "#FF6B6B",
        message: "Perlu Perbaikan",
      };
    default:
      return {
        emoji: "❓",
        color: "#808080",
        message: "Tidak Ada Data",
      };
  }
};

module.exports = {
  calculateDailyHealthScore,
  calculateWeeklyHealthScore,
  analyzeTrends,
  getHealthRecommendations,
  getHealthStatusInfo,
};
