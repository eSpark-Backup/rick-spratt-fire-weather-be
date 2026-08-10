const success = (res, data = {}, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const error = (
  res,
  message = "Error",
  statusCode = 400,
  errorDetails = null
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    ...(errorDetails && { error: errorDetails }),
  });
};

export { success, error };
