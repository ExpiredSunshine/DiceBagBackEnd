class NotFoundError extends Error {
  constructor(message = "Not Found", details = null) {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
    this.details = details;
  }
}

module.exports = NotFoundError;
