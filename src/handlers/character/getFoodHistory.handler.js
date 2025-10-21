const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getFoodHistoryHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        status: "error",
        message:
          "Parameter pagination tidak valid. Page harus >= 1, limit harus 1-100.",
        code: "INVALID_PAGINATION",
      });
    }

    const allowedSortFields = ["createdAt", "foodName", "calories"];
    const allowedSortOrders = ["asc", "desc"];

    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        status: "error",
        message: `Field sort tidak valid. Gunakan: ${allowedSortFields.join(
          ", "
        )}`,
        code: "INVALID_SORT_FIELD",
      });
    }

    if (!allowedSortOrders.includes(sortOrder)) {
      return res.status(400).json({
        status: "error",
        message: "Order sort tidak valid. Gunakan: asc atau desc",
        code: "INVALID_SORT_ORDER",
      });
    }

    console.info("Fetching food history", {
      userId,
      page: pageNum,
      limit: limitNum,
      sortBy,
      sortOrder,
    });

    const totalCount = await prisma.foodHistory.count({
      where: {
        userId: userId,
      },
    });

    const foodHistory = await prisma.foodHistory.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: offset,
      take: limitNum,
      select: {
        id: true,
        foodName: true,
        brandName: true,
        foodDescription: true,
        foodType: true,
        foodUrl: true,
        servingDescription: true,
        calories: true,
        carbohydrate: true,
        fat: true,
        fiber: true,
        protein: true,
        sodium: true,
        sugar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    console.info("Food history fetched successfully", {
      userId,
      totalCount,
      currentPage: pageNum,
      totalPages,
      returnedCount: foodHistory.length,
    });

    return res.status(200).json({
      status: "success",
      message: "Riwayat makanan berhasil diambil",
      data: {
        foodHistory,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage,
          hasPrevPage,
        },
        sort: {
          sortBy,
          sortOrder,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching food history", {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat mengambil riwayat makanan",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
};

module.exports = getFoodHistoryHandler;
