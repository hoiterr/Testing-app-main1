/**
 * Base error class for all API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where our error was thrown
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        details: this.details,
        ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
      }
    };
  }
}

/**
 * 400 Bad Request - The request was invalid or cannot be served
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad Request', details?: Record<string, unknown>) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

/**
 * 401 Unauthorized - Authentication is required
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', details?: Record<string, unknown>) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

/**
 * 403 Forbidden - The request is understood but it has been refused
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', details?: Record<string, unknown>) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

/**
 * 404 Not Found - The requested resource could not be found
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Not Found', details?: Record<string, unknown>) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

/**
 * 409 Conflict - The request could not be completed due to a conflict
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict', details?: Record<string, unknown>) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * 422 Unprocessable Entity - The request was well-formed but was unable to be followed
 */
export class ValidationError extends ApiError {
  constructor(
    message: string = 'Validation Error',
    public readonly fields?: Record<string, string[]>,
    details?: Record<string, unknown>
  ) {
    super(message, 422, 'VALIDATION_ERROR', { ...details, fields }, true);
  }
}

/**
 * 429 Too Many Requests - Rate limiting has been applied
 */
export class RateLimitError extends ApiError {
  constructor(
    message: string = 'Too Many Requests',
    public readonly retryAfter?: number,
    details?: Record<string, unknown>
  ) {
    super(
      message,
      429,
      'RATE_LIMIT_EXCEEDED',
      { ...details, retryAfter },
      true
    );
  }
}

/**
 * 500 Internal Server Error - A generic server error
 */
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal Server Error', details?: Record<string, unknown>) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details, false);
  }
}

/**
 * 501 Not Implemented - The server does not support the functionality required
 */
export class NotImplementedError extends ApiError {
  constructor(message: string = 'Not Implemented', details?: Record<string, unknown>) {
    super(message, 501, 'NOT_IMPLEMENTED', details);
  }
}

/**
 * 503 Service Unavailable - The server is currently unavailable
 */
export class ServiceUnavailableError extends ApiError {
  constructor(
    message: string = 'Service Unavailable',
    public readonly retryAfter?: number,
    details?: Record<string, unknown>
  ) {
    super(
      message,
      503,
      'SERVICE_UNAVAILABLE',
      { ...details, retryAfter },
      true
    );
  }
}

/**
 * Error handler middleware
 */
export const errorHandler = (error: Error, req: any, res: any, next: any) => {
  // Default to 500 if status code not set
  const statusCode = 'statusCode' in error ? (error as any).statusCode : 500;
  const response: any = {
    error: {
      name: error.name,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  };

  // Add additional error details if available
  if ('details' in error) {
    response.error.details = (error as any).details;
  }

  // Set the status code
  res.status(statusCode).json(response);

  // Log the error
  if (statusCode >= 500) {
    console.error('Server Error:', error);
  }
};
