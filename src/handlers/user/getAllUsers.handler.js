const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getAllUsersHandler = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause = {
      isDeleted: false,
      ...(search && {
        OR: [
          { username: { contains: search } },
          { fullName: { contains: search } },
          { email: { contains: search } },
        ],
      }),
    };

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    res.json({
      status: "success",
      message: "Data user berhasil diambil",
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat mengambil data user",
      data: null,
    });
  }
};

module.exports = getAllUsersHandler;
