const express = require("express");
const dotenv = require("dotenv");
const routes = require("./routes");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use("/api", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      status: "error",
      message: "Ukuran file terlalu besar. Maksimal 5MB.",
      code: "FILE_TOO_LARGE",
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      status: "error",
      message: "Field file tidak valid. Gunakan field 'image'.",
      code: "INVALID_FILE_FIELD",
    });
  }

  if (err.message && err.message.includes("Only image files")) {
    return res.status(400).json({
      status: "error",
      message:
        "Format file tidak didukung. Gunakan format JPEG, JPG, PNG, GIF, atau WEBP.",
      code: "INVALID_FILE_TYPE",
    });
  }

  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    code: "INTERNAL_SERVER_ERROR",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
