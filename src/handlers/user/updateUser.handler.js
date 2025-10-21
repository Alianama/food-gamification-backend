const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { logUpdate } = require("../../utils/logger");

const prisma = new PrismaClient();

const updateUserHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, username, email, password, roleId } = req.body;

    // Validasi input
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        status: "error",
        message: "ID user tidak valid",
        data: null,
      });
    }

    if (!fullName || !username || !email || !roleId) {
      return res.status(400).json({
        status: "error",
        message: "Semua field (fullName, username, email, roleId) wajib diisi",
        data: null,
      });
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "error",
        message: "Format email tidak valid",
        data: null,
      });
    }

    // Cek user yang akan diupdate
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser || existingUser.isDeleted) {
      return res.status(404).json({
        status: "error",
        message: "User tidak ditemukan",
        data: null,
      });
    }

    // Cek apakah username/email sudah digunakan user lain
    const duplicate = await prisma.user.findFirst({
      where: {
        OR: [
          { username, NOT: { id: parseInt(id) } },
          { email, NOT: { id: parseInt(id) } },
        ],
      },
    });

    if (duplicate) {
      return res.status(400).json({
        status: "error",
        message: "Username atau email sudah digunakan user lain",
        data: null,
      });
    }

    // Cek apakah role ada
    const role = await prisma.role.findUnique({
      where: { id: parseInt(roleId) },
    });

    if (!role) {
      return res.status(400).json({
        status: "error",
        message: "Role tidak ditemukan",
        data: null,
      });
    }

    // Siapkan data update
    const data = {
      fullName,
      username,
      email,
      roleId: parseInt(roleId),
    };

    // Jika ada password baru, hash dan tambahkan ke data
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          status: "error",
          message: "Password minimal 6 karakter",
          data: null,
        });
      }
      data.password = await bcrypt.hash(password, 10);
      data.tokenVersion = { increment: 1 }; // Invalidate semua token user
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
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
    });

    // Log aktivitas update
    await logUpdate(
      "users",
      req.user.id,
      parseInt(id),
      {
        fullName: existingUser.fullName,
        username: existingUser.username,
        email: existingUser.email,
        roleId: existingUser.roleId,
      },
      { fullName, username, email, roleId },
      `User diupdate: ${fullName}`
    );

    res.json({
      status: "success",
      message: "User berhasil diupdate",
      data: user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat mengupdate user",
      data: null,
    });
  }
};

module.exports = updateUserHandler;
