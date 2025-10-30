const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const decodeBase64Handler = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(userId)) {
    return res.status(400).send("Invalid user ID");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePicture: true, profilePictureMimeType: true },
    });

    if (!user || !user.profilePicture) {
      return res.status(404).send("Profile picture not found");
    }

    const imgBuffer = Buffer.from(user.profilePicture, "base64");

    res.setHeader("Content-Type", user.profilePictureMimeType || "image/png");
    res.setHeader("Content-Length", imgBuffer.length);

    res.send(imgBuffer);
  } catch (err) {
    console.error("Error fetching profile picture:", err);
    res.status(500).send("Error fetching profile picture");
  }
};

module.exports = decodeBase64Handler;
