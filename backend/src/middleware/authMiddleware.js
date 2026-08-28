const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect — reads the JWT from the HTTP-only cookie, verifies it,
 * loads the user from the database, and attaches it to req.user.
 * Rejects with 401 if anything is missing or invalid.
 */
async function protect(req, res, next) {
  const token = req.cookies && req.cookies.fd_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated. Please log in.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // select("+password") is NOT used here — password stays hidden
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "The account belonging to this token no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session. Please log in again.",
    });
  }
}

/**
 * authorizeRoles(...roles) — factory that returns a middleware which
 * allows only users whose role is in the provided list.
 * Must be used AFTER protect.
 *
 * Usage:
 *   router.post("/", protect, authorizeRoles("CONSUMER"), createDemand);
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of: ${roles.join(", ")}.`,
      });
    }
    next();
  };
}

module.exports = { protect, authorizeRoles };
