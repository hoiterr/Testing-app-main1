export class BadRequestError extends Error {
  public readonly details?: Record<string, unknown>;
  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'BadRequestError';
    this.details = details;
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends Error {
  public readonly fields: Record<string, string[]>;
  public readonly context?: Record<string, unknown>;
  constructor(
    message: string,
    fields: Record<string, string[]>,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
    this.context = context;
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }
}
