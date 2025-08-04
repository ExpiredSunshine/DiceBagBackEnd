class UnauthorizedError extends Error {
  constructor(message = "Unauthorized", details = null) {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401;
    this.details = details;
  }
}

module.exports = UnauthorizedError;
