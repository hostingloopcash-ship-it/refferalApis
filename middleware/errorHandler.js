// Global error handler middleware
const errorHandler = (error, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, error);
  
  // Default error response
  let statusCode = error.statusCode || 500;
  let errorResponse = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred'
    }
  };
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorResponse.error.code = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    errorResponse.error.code = 'UNAUTHORIZED';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    errorResponse.error.code = 'FORBIDDEN';
  }
  
  res.status(statusCode).json(errorResponse);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};