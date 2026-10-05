export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;
  readonly isOperational = true;

  constructor(statusCode: number, message: string, code = "APP_ERROR", details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, AppError);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, message, "BAD_REQUEST", details);
  }

  static unauthorized(message = "Authentication required"): AppError {
    return new AppError(401, message, "UNAUTHORIZED");
  }

  static forbidden(message = "You do not have access to this resource"): AppError {
    return new AppError(403, message, "FORBIDDEN");
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError(404, message, "NOT_FOUND");
  }

  static conflict(message: string): AppError {
    return new AppError(409, message, "CONFLICT");
  }

  static internal(message = "Internal server error"): AppError {
    return new AppError(500, message, "INTERNAL_ERROR");
  }
}