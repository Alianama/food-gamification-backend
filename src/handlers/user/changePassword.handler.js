const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const changePasswordHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "Password lama dan password baru diperlukan.",
        code: "MISSING_FIELDS",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password baru minimal 6 karakter.",
        code: "PASSWORD_TOO_SHORT",
      });
    }

    // Ambil data user termasuk password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User tidak ditemukan.",
        code: "USER_NOT_FOUND",
      });
    }

    // Verifikasi password lama
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Password lama tidak sesuai.",
        code: "WRONG_CURRENT_PASSWORD",
      });
    }

    // Pastikan password baru berbeda dari yang lama
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        status: "error",
        message: "Password baru tidak boleh sama dengan password lama.",
        code: "SAME_PASSWORD",
      });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update ke database
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      status: "success",
      message: "Password berhasil diubah.",
    });
  } catch (error) {
    console.error("Error changing password", {
      userId: req.user?.id,
      error: error.message,
    });
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat mengubah password.",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
};

module.exports = changePasswordHandler;
