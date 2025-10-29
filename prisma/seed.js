const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing data
    await prisma.log.deleteMany({});
    await prisma.character.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role_permission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();

    // Create permissions
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

    // Create roles
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

    const hashedPassword = await bcrypt.hash("123321", 10);
    const adminHashedPassword = await bcrypt.hash("admin123", 10);
    const userHashedPassword = await bcrypt.hash("user123", 10);

    const now = new Date();

    // ✅ Create Super Admin + Character
    const superAdmin = await prisma.user.create({
      data: {
        username: "superadmin",
        fullName: "Super Admin",
        email: "superadmin@example.com",
        password: hashedPassword,
        roleId: superAdminRole.id,
      },
    });
    await prisma.character.create({
      data: {
        userId: superAdmin.id,
        createdAt: now,
        updatedAt: now,
      },
    });

    // ✅ Create Admin + Character
    const admin = await prisma.user.create({
      data: {
        username: "admin",
        fullName: "Admin",
        email: "admin@example.com",
        password: adminHashedPassword,
        roleId: adminRole.id,
      },
    });
    await prisma.character.create({
      data: {
        userId: admin.id,
        createdAt: now,
        updatedAt: now,
      },
    });

    // ✅ Create Regular User + Character
    const user = await prisma.user.create({
      data: {
        username: "user",
        fullName: "User",
        email: "user@example.com",
        password: userHashedPassword,
        roleId: userRole.id,
      },
    });
    await prisma.character.create({
      data: {
        userId: user.id,
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
