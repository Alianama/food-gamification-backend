/**
 * XP Calculation Service
 * Menghitung XP berdasarkan nutrisi makanan yang dikonsumsi
 */

/**
 * Menghitung XP dari data nutrisi makanan
 * @param {Object} nutrition - Data nutrisi makanan
 * @param {number} nutrition.calories - Kalori per porsi
 * @param {number} nutrition.protein - Protein dalam gram
 * @param {number} nutrition.fiber - Serat dalam gram
 * @param {number} nutrition.sugar - Gula dalam gram
 * @param {number} nutrition.sodium - Natrium dalam mg
 * @returns {Object} - { xpGained, breakdown }
 */
const calculateXP = (nutrition) => {
  const {
    calories = 0,
    protein = 0,
    fiber = 0,
    sugar = 0,
    sodium = 0,
  } = nutrition;

  // Konfigurasi target nutrisi
  const TARGET_CALORIES = 500; // Target kalori per porsi
  const CALORIE_TOLERANCE = 0.15; // Toleransi ±15%
  const CALORIE_TOLERANCE_MIN = TARGET_CALORIES * (1 - CALORIE_TOLERANCE); // 425
  const CALORIE_TOLERANCE_MAX = TARGET_CALORIES * (1 + CALORIE_TOLERANCE); // 575

  let xpGained = 0;
  const breakdown = {
    baseCalorieXP: 0,
    proteinBonus: 0,
    fiberBonus: 0,
    sugarPenalty: 0,
    sodiumPenalty: 0,
    total: 0,
  };

  // 1. Base XP dari kalori (bobot terbesar)
  if (calories >= CALORIE_TOLERANCE_MIN && calories <= CALORIE_TOLERANCE_MAX) {
    // Dalam toleransi (±15% dari 500 kcal) = 10 XP
    breakdown.baseCalorieXP = 10;
  } else {
    // Di luar toleransi, kurangi 1 XP per 25 kcal deviasi
    const deviation = Math.max(
      Math.abs(calories - TARGET_CALORIES) -
        TARGET_CALORIES * CALORIE_TOLERANCE,
      0
    );
    const penalty = Math.floor(deviation / 25);
    breakdown.baseCalorieXP = Math.max(0, 10 - penalty);
  }

  // 2. Bonus protein
  if (protein >= 30) {
    breakdown.proteinBonus = 2; // ≥30g = +2 XP
  } else if (protein >= 20) {
    breakdown.proteinBonus = 1; // ≥20g = +1 XP
  }

  // 3. Bonus serat
  if (fiber >= 5) {
    breakdown.fiberBonus = 1; // ≥5g = +1 XP
  }

  // 4. Penalti gula
  if (sugar > 30) {
    breakdown.sugarPenalty = -2; // >30g = -2 XP
  } else if (sugar > 20) {
    breakdown.sugarPenalty = -1; // >20g = -1 XP
  }

  // 5. Penalti natrium
  if (sodium > 1000) {
    breakdown.sodiumPenalty = -2; // >1000mg = -2 XP
  } else if (sodium > 700) {
    breakdown.sodiumPenalty = -1; // >700mg = -1 XP
  }

  // Hitung total XP
  xpGained = Math.max(
    0,
    Math.min(
      15,
      breakdown.baseCalorieXP +
        breakdown.proteinBonus +
        breakdown.fiberBonus +
        breakdown.sugarPenalty +
        breakdown.sodiumPenalty
    )
  );

  breakdown.total = xpGained;

  return {
    xpGained,
    breakdown,
    nutrition: {
      calories,
      protein,
      fiber,
      sugar,
      sodium,
    },
  };
};

/**
 * Menghitung level baru berdasarkan XP total
 * @param {number} currentXP - XP saat ini
 * @param {number} xpToAdd - XP yang akan ditambahkan
 * @param {number} currentLevel - Level saat ini
 * @param {number} currentXPToNext - XP yang dibutuhkan ke level berikutnya
 * @returns {Object} - { newLevel, newXP, newXPToNext, levelUp }
 */
const calculateLevelUp = (
  currentXP,
  xpToAdd,
  currentLevel,
  currentXPToNext
) => {
  let newXP = currentXP + xpToAdd;
  let newLevel = currentLevel;
  let newXPToNext = currentXPToNext;
  let levelUp = false;

  // Cek apakah naik level
  while (newXP >= newXPToNext) {
    newXP -= newXPToNext;
    newLevel += 1;
    levelUp = true;

    // Update XP yang dibutuhkan untuk level berikutnya
    // Formula: base 100 + (level * 20)
    newXPToNext = 100 + newLevel * 20;
  }

  return {
    newLevel,
    newXP,
    newXPToNext,
    levelUp,
    levelsGained: newLevel - currentLevel,
  };
};

/**
 * Mendapatkan informasi level character
 * @param {number} level - Level character
 * @returns {Object} - { levelName, description, color }
 */
const getLevelInfo = (level) => {
  if (level >= 50) {
    return {
      levelName: "Master Chef",
      description: "Pakar nutrisi sejati!",
      color: "#FFD700", // Gold
    };
  } else if (level >= 30) {
    return {
      levelName: "Expert Nutritionist",
      description: "Ahli nutrisi berpengalaman",
      color: "#C0C0C0", // Silver
    };
  } else if (level >= 20) {
    return {
      levelName: "Health Enthusiast",
      description: "Pecinta hidup sehat",
      color: "#CD7F32", // Bronze
    };
  } else if (level >= 10) {
    return {
      levelName: "Healthy Eater",
      description: "Pemakan sehat yang konsisten",
      color: "#32CD32", // Green
    };
  } else if (level >= 5) {
    return {
      levelName: "Health Learner",
      description: "Sedang belajar hidup sehat",
      color: "#87CEEB", // Sky Blue
    };
  } else {
    return {
      levelName: "Health Beginner",
      description: "Pemula dalam perjalanan sehat",
      color: "#DDA0DD", // Plum
    };
  }
};

/**
 * Mendapatkan rekomendasi berdasarkan nutrisi
 * @param {Object} nutrition - Data nutrisi
 * @returns {Array} - Array rekomendasi
 */
const getNutritionRecommendations = (nutrition) => {
  const recommendations = [];
  const { calories, protein, fiber, sugar, sodium } = nutrition;

  // Rekomendasi kalori
  if (calories < 200) {
    recommendations.push(
      "Makanan ini rendah kalori. Pertimbangkan menambahkan makanan lain untuk memenuhi kebutuhan harian."
    );
  } else if (calories > 800) {
    recommendations.push(
      "Makanan ini tinggi kalori. Pastikan untuk menyeimbangkan dengan aktivitas fisik."
    );
  }

  // Rekomendasi protein
  if (protein < 10) {
    recommendations.push(
      "Tingkatkan asupan protein dengan menambahkan daging, ikan, atau kacang-kacangan."
    );
  } else if (protein >= 30) {
    recommendations.push(
      "Excellent! Protein yang tinggi membantu pertumbuhan otot dan perbaikan sel."
    );
  }

  // Rekomendasi serat
  if (fiber < 3) {
    recommendations.push(
      "Tambahkan lebih banyak sayuran dan buah-buahan untuk meningkatkan asupan serat."
    );
  }

  // Rekomendasi gula
  if (sugar > 25) {
    recommendations.push(
      "Kurangi makanan manis dan pilih alternatif yang lebih sehat."
    );
  }

  // Rekomendasi natrium
  if (sodium > 600) {
    recommendations.push(
      "Kurangi garam dan pilih makanan dengan natrium rendah."
    );
  }

  return recommendations;
};

module.exports = {
  calculateXP,
  calculateLevelUp,
  getLevelInfo,
  getNutritionRecommendations,
};
