const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const FormData = require("form-data");

const prisma = new PrismaClient();

const foodDetectionHandler = async (req, res) => {
  try {
    if (!req.file) {
      console.warn("Food detection request without file upload", {
        userId: req.user?.id,
        ip: req.ip,
      });
      return res.status(400).json({
        status: "error",
        message: "Tidak ada file yang diunggah. Silakan pilih gambar makanan.",
        code: "NO_FILE_UPLOADED",
      });
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(req.file.mimetype)) {
      console.warn("Invalid file type for food detection", {
        userId: req.user?.id,
        fileType: req.file.mimetype,
        fileName: req.file.originalname,
      });
      return res.status(400).json({
        status: "error",
        message:
          "Format file tidak didukung. Gunakan format JPEG, JPG, PNG, GIF, atau WEBP.",
        code: "INVALID_FILE_TYPE",
      });
    }

    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      console.warn("File too large for food detection", {
        userId: req.user?.id,
        fileSize: req.file.size,
        fileName: req.file.originalname,
      });
      return res.status(400).json({
        status: "error",
        message: "Ukuran file terlalu besar. Maksimal 5MB.",
        code: "FILE_TOO_LARGE",
      });
    }

    console.info("Starting food detection", {
      userId: req.user?.id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
    });

    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await axios.post("http://127.0.0.1:5000/predict", form, {
      headers: {
        ...form.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 30000,
    });

    console.info("Food detection completed successfully", {
      userId: req.user?.id,
      fileName: req.file.originalname,
      responseStatus: response.status,
    });

    // Save food detection data to database
    let savedFoodHistory = null;
    try {
      const nutritionInfo = response.data.nutrition_info;
      const nutrition = nutritionInfo.nutrition;

      savedFoodHistory = await prisma.foodHistory.create({
        data: {
          userId: req.user.id,
          foodName: nutritionInfo.food_name || response.data.predicted_food,
          brandName: nutritionInfo.brand_name || "Generic",
          foodDescription: nutritionInfo.food_description || null,
          foodType: nutritionInfo.food_type || null,
          foodUrl: nutritionInfo.food_url || null,
          servingDescription: nutrition.serving_description || null,
          calories: nutrition.calories ? parseFloat(nutrition.calories) : null,
          carbohydrate: nutrition.carbohydrate
            ? parseFloat(nutrition.carbohydrate)
            : null,
          fat: nutrition.fat ? parseFloat(nutrition.fat) : null,
          fiber: nutrition.fiber ? parseFloat(nutrition.fiber) : null,
          protein: nutrition.protein ? parseFloat(nutrition.protein) : null,
          sodium: nutrition.sodium ? parseFloat(nutrition.sodium) : null,
          sugar: nutrition.sugar ? parseFloat(nutrition.sugar) : null,
          isConsumed: false, // Default false, akan diupdate saat konfirmasi
          consumedAt: null,
          xpGained: null,
        },
      });

      console.info("Food history saved successfully", {
        userId: req.user.id,
        foodHistoryId: savedFoodHistory.id,
        foodName: savedFoodHistory.foodName,
      });
    } catch (dbError) {
      console.error("Failed to save food history to database", {
        userId: req.user?.id,
        error: dbError.message,
        stack: dbError.stack,
      });
      // Continue with response even if database save fails
    }

    return res.status(200).json({
      status: "success",
      message: "Makanan berhasil dideteksi",
      data: {
        predictions: response.data,
        fileInfo: {
          originalName: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
        },
        foodHistoryId: savedFoodHistory?.id || null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error.code === "LIMIT_FILE_SIZE") {
      console.warn("File size limit exceeded", {
        userId: req.user?.id,
        error: error.message,
      });
      return res.status(400).json({
        status: "error",
        message: "Ukuran file terlalu besar. Maksimal 5MB.",
        code: "FILE_TOO_LARGE",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      console.warn("Unexpected file field", {
        userId: req.user?.id,
        error: error.message,
      });
      return res.status(400).json({
        status: "error",
        message: "Field file tidak valid. Gunakan field 'image'.",
        code: "INVALID_FILE_FIELD",
      });
    }

    if (error.response) {
      console.error("ML service error", {
        userId: req.user?.id,
        status: error.response.status,
        data: error.response.data,
        fileName: req.file?.originalname,
      });

      return res.status(error.response.status).json({
        status: "error",
        message: "Terjadi kesalahan pada layanan deteksi makanan",
        code: "ML_SERVICE_ERROR",
        details: error.response.data,
      });
    }

    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      console.error("ML service unavailable", {
        userId: req.user?.id,
        error: error.message,
        code: error.code,
      });
      return res.status(503).json({
        status: "error",
        message:
          "Layanan deteksi makanan sedang tidak tersedia. Silakan coba lagi nanti.",
        code: "SERVICE_UNAVAILABLE",
      });
    }

    if (error.code === "ECONNABORTED") {
      console.error("ML service timeout", {
        userId: req.user?.id,
        error: error.message,
        fileName: req.file?.originalname,
      });
      return res.status(504).json({
        status: "error",
        message:
          "Waktu tunggu habis. Silakan coba lagi dengan gambar yang lebih kecil.",
        code: "SERVICE_TIMEOUT",
      });
    }

    console.error("Unexpected error in food detection", {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      fileName: req.file?.originalname,
    });

    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan internal. Silakan coba lagi nanti.",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
};

module.exports = foodDetectionHandler;
