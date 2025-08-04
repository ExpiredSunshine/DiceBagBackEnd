const {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require("../utils/error-classes");

/**
 * @param {Error} error - The error that was thrown
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const errorHandler = (error, req, res) => {
  // Log the error details
  console.error(`[ErrorHandler] ${error.name}: ${error.message}`);
  console.error(`[ErrorHandler] Stack:`, error.stack);
  console.error(
    `[ErrorHandler] Request: ${req.method} ${req.url} from ${req.ip}`
  );

  // Define custom error classes
  const customErrors = [
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
  ];

  const isCustomError = customErrors.some(
    (ErrorClass) => error instanceof ErrorClass
  );

  if (isCustomError) {
    // Handle custom errors
    return res.status(error.statusCode).json({
      error: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle unknown errors
  console.error(`[ErrorHandler] Unknown error type: ${error.constructor.name}`);

  res.status(500).json({
    error: "Internal server error",
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorHandler;
