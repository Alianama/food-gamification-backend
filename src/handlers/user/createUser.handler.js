const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { logCreate } = require("../../utils/logger");

const prisma = new PrismaClient();

const createUserHandler = async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body;

    if (!username || !fullName || !email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Semua field wajib diisi",
        data: null,
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "error",
        message: "Format email tidak valid",
        data: null,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password minimal 6 karakter",
        data: null,
      });
    }

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

    const hashedPassword = await bcrypt.hash(password, 10);

    // default (3 = User biasa)
    const defaultRoleId = 3;

    const user = await prisma.user.create({
      data: {
        username,
        fullName,
        email,
        password: hashedPassword,
        roleId: defaultRoleId,
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

    if (req.user?.id) {
      await logCreate(
        "users",
        req.user.id,
        user.id,
        { username, fullName, email },
        `User baru dibuat: ${fullName}`
      );
    }

    return res.status(201).json({
      status: "success",
      message: "User berhasil dibuat",
      data: user,
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat membuat user",
      data: null,
    });
  }
};

module.exports = createUserHandler;
