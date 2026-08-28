const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ── helpers ───────────────────────────────────────────────────────────────

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function sendTokenCookie(res, token) {
  const maxAge =
    parseInt(process.env.JWT_COOKIE_DAYS || "7", 10) * 24 * 60 * 60 * 1000;

  // For cross-origin cookies (different frontend/backend domains), use sameSite: "none" and secure: true
  const isCrossOrigin = process.env.SAME_SITE_NONE === "true" || process.env.NODE_ENV === "production";
  
  res.cookie("fd_token", token, {
    httpOnly: true,           // not accessible from JS
    secure: isCrossOrigin,    // HTTPS only for cross-origin or production
    sameSite: isCrossOrigin ? "none" : "lax",  // "none" for cross-origin, "lax" for same-origin
    maxAge,
  });
}

// ── POST /api/auth/register ───────────────────────────────────────────────
async function register(req, res, next) {
  try {
    const { name, email, password, role, location } = req.body;

    // Manual validation before hitting the DB
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required." });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: "A valid email is required." });
    }
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 6 characters." });
    }
    if (!role || !["CONSUMER", "FARMER"].includes(role.toUpperCase())) {
      return res
        .status(400)
        .json({ success: false, message: "Role must be CONSUMER or FARMER." });
    }
    if (!location || !location.trim()) {
      return res.status(400).json({ success: false, message: "Location is required." });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "An account with this email already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role.toUpperCase(),
      location: location.trim(),
    });

    const token = signToken(user._id);
    sendTokenCookie(res, token);

    res.status(201).json({ success: true, data: { user: user.toSafeObject() } });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    // Explicitly include password (select: false on schema)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect email or password." });
    }

    const token = signToken(user._id);
    sendTokenCookie(res, token);

    res.json({ success: true, data: { user: user.toSafeObject() } });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────
function logout(req, res) {
  const isCrossOrigin = process.env.SAME_SITE_NONE === "true" || process.env.NODE_ENV === "production";
  
  res.cookie("fd_token", "", {
    httpOnly: true,
    secure: isCrossOrigin,
    sameSite: isCrossOrigin ? "none" : "lax",
    maxAge: 0, // expire immediately
    expires: new Date(0),
  });
  res.json({ success: true, data: null });
}

// ── GET /api/auth/me ──────────────────────────────────────────────────────
function getMe(req, res) {
  // protect middleware already validated the token and attached req.user
  res.json({ success: true, data: { user: req.user.toSafeObject() } });
}

module.exports = { register, login, logout, getMe };
