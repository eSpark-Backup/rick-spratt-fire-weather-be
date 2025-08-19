// class CustomError extends Error {
//   constructor(message, statusCode = 400) {
//     super(message);
//     this.statusCode = statusCode;
//     Error.captureStackTrace(this, this.constructor);
//   }
// }

// export { CustomError };

class CustomError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} [statusCode=400] - HTTP status code
   * @param {string} [code="OP_ERROR"] - Machine-readable error code
   * @param {object} [meta={}] - Optional metadata for debugging or context
   */
  constructor(message, statusCode = 400, code = "OP_ERROR", meta = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.meta = meta; // optional extra info
    Error.captureStackTrace(this, this.constructor);
  }
}

export { CustomError };
