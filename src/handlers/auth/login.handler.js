const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { generateTokens } = require("../../utils/jwt");

const prisma = new PrismaClient();

const loginHandler = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validasi input
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Username dan password harus diisi",
        data: null,
      });
    }

    // Cari user berdasarkan username
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Username atau password salah",
        data: null,
      });
    }

    // Cek apakah user sudah dihapus (soft delete)
    if (user.isDeleted) {
      return res.status(401).json({
        status: "error",
        message: "Akun tidak aktif",
        data: null,
      });
    }

    // Verifikasi password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        status: "error",
        message: "Username atau password salah",
        data: null,
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Response sukses
    res.json({
      status: "success",
      message: "Login berhasil",
      data: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
      data: null,
    });
  }
};

module.exports = loginHandler;
