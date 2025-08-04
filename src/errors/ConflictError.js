class ConflictError extends Error {
  constructor(message = "Conflict", details = null) {
    super(message);
    this.name = "ConflictError";
    this.statusCode = 409;
    this.details = details;
  }
}

module.exports = ConflictError;
