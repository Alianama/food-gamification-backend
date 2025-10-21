const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { logUpdate } = require("../../utils/logger");

const prisma = new PrismaClient();

const resetPasswordHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validasi input
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        status: "error",
        message: "ID user tidak valid",
        data: null,
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        status: "error",
        message: "Password baru wajib diisi",
        data: null,
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password baru minimal 6 karakter",
        data: null,
      });
    }

    // Cari user
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

    if (!user || user.isDeleted) {
      return res.status(404).json({
        status: "error",
        message: "User tidak ditemukan",
        data: null,
      });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password dan increment tokenVersion untuk invalidate semua token
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        password: hashedPassword,
        tokenVersion: { increment: 1 },
      },
    });

    // Log aktivitas reset password
    await logUpdate(
      "users",
      req.user.id,
      parseInt(id),
      { password: "***" },
      { password: "***" },
      `Password user direset: ${user.fullName}`
    );

    res.json({
      status: "success",
      message: "Password user berhasil direset. User harus login ulang.",
      data: null,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      status: "error",
      message: "Gagal mereset password user",
      data: null,
    });
  }
};

module.exports = resetPasswordHandler;
