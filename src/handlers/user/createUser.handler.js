const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { logCreate } = require("../../utils/logger");

const prisma = new PrismaClient();

const createUserHandler = async (req, res) => {
  try {
    const { username, fullName, email, password, roleId } = req.body;

    // Validasi input
    if (!username || !fullName || !email || !password || !roleId) {
      return res.status(400).json({
        status: "error",
        message: "Semua field wajib diisi",
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

    // Validasi panjang password
    if (password.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password minimal 6 karakter",
        data: null,
      });
    }

    // Cek apakah username atau email sudah digunakan
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Username atau email sudah digunakan",
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        username,
        fullName,
        email,
        password: hashedPassword,
        roleId: parseInt(roleId),
        tokenVersion: 0,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // Log aktivitas create
    await logCreate(
      "users",
      req.user.id,
      user.id,
      { username, fullName, email, roleId },
      `User baru dibuat: ${fullName}`
    );

    res.status(201).json({
      status: "success",
      message: "User berhasil dibuat",
      data: user,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat membuat user",
      data: null,
    });
  }
};

module.exports = createUserHandler;
