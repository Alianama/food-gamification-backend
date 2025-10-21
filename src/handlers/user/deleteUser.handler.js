const { PrismaClient } = require("@prisma/client");
const { logDelete } = require("../../utils/logger");

const prisma = new PrismaClient();

const deleteUserHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Validasi input
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        status: "error",
        message: "ID user tidak valid",
        data: null,
      });
    }

    // Cek apakah user mencoba menghapus dirinya sendiri
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        status: "error",
        message: "Tidak bisa menghapus user sendiri",
        data: null,
      });
    }

    // Cari user yang akan dihapus
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        isDeleted: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User tidak ditemukan",
        data: null,
      });
    }

    if (user.isDeleted) {
      return res.status(400).json({
        status: "error",
        message: "User sudah dihapus",
        data: null,
      });
    }

    // Soft delete user
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isDeleted: true },
    });

    // Log aktivitas delete
    await logDelete(
      "users",
      req.user.id,
      parseInt(id),
      {
        fullName: user.fullName,
        username: user.username,
        email: user.email,
      },
      `User dihapus: ${user.fullName}`
    );

    res.json({
      status: "success",
      message: "User berhasil dihapus",
      data: null,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat menghapus user",
      data: null,
    });
  }
};

module.exports = deleteUserHandler;
