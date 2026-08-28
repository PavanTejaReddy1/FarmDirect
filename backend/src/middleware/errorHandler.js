/**
 * Centralised error-handling middleware.
 * Always returns { success: false, message } so the frontend has
 * a predictable shape to check regardless of what went wrong.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(`[${req.method} ${req.path}]`, err.message);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join("; ") });
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid ID format." });
  }

  // Duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: "Duplicate entry." });
  }

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "An unexpected error occurred.",
  });
}

module.exports = errorHandler;
