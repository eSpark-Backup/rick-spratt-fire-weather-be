class CustomError extends Error {
  constructor(message, statusCode = 400, code = "OP_ERROR", meta = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.meta = meta;
    Error.captureStackTrace(this, this.constructor);
  }
}

export { CustomError };
