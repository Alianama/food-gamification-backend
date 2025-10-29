const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  try {
    // ------------------ HAPUS DATA ------------------
    await prisma.log.deleteMany({});
    await prisma.character.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role_permission.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.role.deleteMany({});

    // ------------------ PERMISSIONS ------------------
    const permissions = await Promise.all([
      prisma.permission.create({
        data: {
          name: "MANAGE_USERS",
          description: "Dapat mengelola pengguna",
        },
      }),
      prisma.permission.create({
        data: {
          name: "MANAGE_ROLES",
          description: "Dapat mengelola peran",
        },
      }),
      prisma.permission.create({
        data: {
          name: "VIEW_PROFILE",
          description: "Dapat melihat profil sendiri",
        },
      }),
    ]);

    // ------------------ ROLES ------------------
    const superAdminRole = await prisma.role.create({
      data: {
        name: "SUPER_ADMIN",
        description: "Super Administrator dengan akses penuh",
        permissions: {
          create: permissions.map((permission) => ({
            permission: { connect: { id: permission.id } },
          })),
        },
      },
    });

    const adminRole = await prisma.role.create({
      data: {
        name: "ADMIN",
        description: "Administrator dengan akses terbatas",
        permissions: {
          create: permissions
            .filter((p) => p.name !== "MANAGE_ROLES")
            .map((permission) => ({
              permission: { connect: { id: permission.id } },
            })),
        },
      },
    });

    const userRole = await prisma.role.create({
      data: {
        name: "USER",
        description: "Pengguna biasa",
        permissions: {
          create: permissions
            .filter((p) => p.name === "VIEW_PROFILE")
            .map((permission) => ({
              permission: { connect: { id: permission.id } },
            })),
        },
      },
    });

    // ------------------ PASSWORD HASH ------------------
    const superAdminPassword = await bcrypt.hash("123321", 10);
    const adminPassword = await bcrypt.hash("admin123", 10);
    const userPassword = await bcrypt.hash("user123", 10);

    const now = new Date();

    // ------------------ CREATE USERS & CHARACTERS ------------------

    // Super Admin
    const superAdmin = await prisma.user.create({
      data: {
        username: "superadmin",
        fullName: "Super Admin",
        email: "superadmin@example.com",
        password: superAdminPassword,
        roleId: superAdminRole.id,
      },
    });
    await prisma.character.create({
      data: {
        userId: superAdmin.id,
        statusName: "New User",
        healthPoint: 0,
        xpPoint: 0,
        xpToNextLevel: 0,
        level: 0,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Admin
    const admin = await prisma.user.create({
      data: {
        username: "admin",
        fullName: "Admin",
        email: "admin@example.com",
        password: adminPassword,
        roleId: adminRole.id,
      },
    });
    await prisma.character.create({
      data: {
        userId: admin.id,
        statusName: "New User",
        healthPoint: 0,
        xpPoint: 0,
        xpToNextLevel: 0,
        level: 0,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Regular User
    const user = await prisma.user.create({
      data: {
        username: "user",
        fullName: "User",
        email: "user@example.com",
        password: userPassword,
        roleId: userRole.id,
      },
    });
    await prisma.character.create({
      data: {
        userId: user.id,
        statusName: "New User",
        healthPoint: 0,
        xpPoint: 0,
        xpToNextLevel: 0,
        level: 0,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      },
    });

    console.log("✅ Seed berhasil dijalankan!");
    console.log("📌 Default users created (semua sudah punya character):");
    console.log("- superadmin / 123321");
    console.log("- admin / admin123");
    console.log("- user / user123");
  } catch (error) {
    console.error("❌ Error saat menjalankan seed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
