const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const notFound = (req, res, next) => {
  next(new ApiError(404, `Recurso no encontrado: ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  if (!(err instanceof ApiError)) {
    console.error(err);
  }

  res.status(statusCode).json({
    error: message,
    ...(env.nodeEnv === 'development' && !(err instanceof ApiError) ? { stack: err.stack } : {}),
  });
};

module.exports = { notFound, errorHandler };
