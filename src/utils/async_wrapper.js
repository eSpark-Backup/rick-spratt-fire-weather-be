// const asyncWrapper = (fn) => (req, res, next) => {
//   Promise.resolve(fn(req, res, next)).catch(next);
// };

// export { asyncWrapper };

const asyncWrapper = (fn, options = {}) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      // Optional context logging
      if (options.context) {
        console.error(`[ASYNC ERROR] Context: ${options.context}`);
      } else {
        console.error(`[ASYNC ERROR] ${req.method} ${req.originalUrl}`);
      }
      next(err); // Pass to global error handler
    }
  };
};

export { asyncWrapper };
