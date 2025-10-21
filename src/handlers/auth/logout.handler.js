const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const logoutHandler = async (req, res) => {
  try {
    // Invalidate token dengan increment tokenVersion
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });

    res.json({
      status: "success",
      message: "Logout berhasil",
      data: null,
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
      data: null,
    });
  }
};

module.exports = logoutHandler;
