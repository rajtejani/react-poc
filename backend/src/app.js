const express = require("express");
const cors = require("cors");
const printerRoutes = require("./routes/printerRoutes");
const logger = require("./utils/logger");

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: "10mb" })); // support large base64 print images

// Logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use("/api/printer", printerRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(`App Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error"
  });
});

module.exports = app;