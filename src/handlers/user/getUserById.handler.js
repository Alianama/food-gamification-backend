const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getUserByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        status: "error",
        message: "ID user tidak valid",
        data: null,
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
        isDeleted: false,
      },
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
            permissions: {
              select: {
                permission: {
                  select: {
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User tidak ditemukan",
        data: null,
      });
    }

    // Transform dates to ISO string
    const transformedUser = {
      ...user,
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    };

    res.json({
      status: "success",
      message: "Data user berhasil diambil",
      data: transformedUser,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat mengambil data user",
      data: null,
    });
  }
};

module.exports = getUserByIdHandler;
