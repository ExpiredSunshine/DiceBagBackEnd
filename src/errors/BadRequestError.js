class BadRequestError extends Error {
  constructor(message = "Bad Request", details = null) {
    super(message);
    this.name = "BadRequestError";
    this.statusCode = 400;
    this.details = details;
  }
}

module.exports = BadRequestError;
