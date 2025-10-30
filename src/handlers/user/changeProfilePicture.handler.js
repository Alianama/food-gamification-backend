const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const changeProfilePictureHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        status: "error",
        message: "Profile picture file is required",
        data: null,
      });
    }

    // Convert file buffer to Base64
    const mimeType = file.mimetype;
    const base64Image = file.buffer.toString("base64");

    // Update database
    await prisma.user.update({
      where: { id: userId },
      data: { profilePicture: base64Image, profilePictureMimeType: mimeType },
    });

    res.json({
      status: "success",
      message: "Profile picture updated successfully",
      data: null,
    });
  } catch (error) {
    console.error("Change profile picture error:", error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while updating profile picture",
      data: null,
    });
  }
};

module.exports = changeProfilePictureHandler;
