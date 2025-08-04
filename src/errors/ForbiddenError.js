class ForbiddenError extends Error {
  constructor(message = "Forbidden", details = null) {
    super(message);
    this.name = "ForbiddenError";
    this.statusCode = 403;
    this.details = details;
  }
}

module.exports = ForbiddenError;
