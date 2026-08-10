const asyncWrapper = (fn, options = {}) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      if (options.context) {
        console.error(`[ASYNC ERROR] Context: ${options.context}`);
      } else {
        console.error(`[ASYNC ERROR] ${req.method} ${req.originalUrl}`);
      }
      next(err);
    }
  };
};

export { asyncWrapper };
