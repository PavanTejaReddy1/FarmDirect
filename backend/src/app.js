const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/errorHandler");
const connectDB = require("./config/db");

const authRoutes       = require("./routes/authRoutes");
const demandRoutes     = require("./routes/demandRoutes");
const supplyRoutes     = require("./routes/supplyRoutes");
const commitmentRoutes = require("./routes/commitmentRoutes");
const matchingRoutes   = require("./routes/matchingRoutes");
const aiRoutes         = require("./routes/aiRoutes");

const app = express();

// ── CORS — allow credentials so browser sends cookies ─────────────────────
const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = [
  "http://localhost:5173", // Vite default
  "http://localhost:4173", // Vite preview
  "http://localhost:3000",
  "https://farm-direct-nine.vercel.app",
];

if (frontendUrl && !allowedOrigins.includes(frontendUrl)) {
  allowedOrigins.push(frontendUrl);
}

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no Origin header (Postman, curl, direct browser)
      // or origins matching allowedOrigins list or any *.vercel.app domain
      if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
        cb(null, true);
      } else {
        cb(new Error(`CORS: origin ${origin} not allowed.`));
      }
    },
    credentials: true, // allow cookies to be sent cross-origin
  })
);

// ── Core middleware ───────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// ── Auto-connect DB middleware for serverless / Vercel ─────────────────────
app.use(async (req, res, next) => {
  try {
    if (process.env.MONGODB_URI) {
      await connectDB();
    }
    next();
  } catch (err) {
    next(err);
  }
});

// ── Root welcome handler ──────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FarmDirect API Server is running",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      demands: "/api/demands",
      supplies: "/api/supplies",
      commitments: "/api/commitments",
      matching: "/api/matching",
      ai: "/api/ai",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({ success: true, message: "FarmDirect API is running" });
});

// ── Health check ─────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "FarmDirect API is running" });
});

// ── API routes ────────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/demands",     demandRoutes);
app.use("/api/supplies",    supplyRoutes);
app.use("/api/commitments", commitmentRoutes);
app.use("/api/matching",    matchingRoutes);
app.use("/api/ai",          aiRoutes);

// ── 404 catch-all ────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found.` });
});

// ── Centralised error handler (must be last) ─────────────────────────────
app.use(errorHandler);

module.exports = app;
