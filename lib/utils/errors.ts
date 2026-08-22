export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation Error') {
    super(message, 400, true);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Not Authenticated') {
    super(message, 401, true);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required to access this resource') {
    super(message, 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not Authorized') {
    super(message, 403, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource Not Found') {
    super(message, 404, true);
  }
}

export function formatErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred';

  if (
    typeof error === 'object' &&
    error !== null &&
    'issues' in error &&
    Array.isArray((error as { issues: unknown[] }).issues)
  ) {
    const issues = (error as { issues: Array<{ path?: (string | number)[]; message?: string }> })
      .issues;
    const first = issues[0];
    if (first) {
      if (first.path?.includes('dropoffDate') || first.message?.toLowerCase().includes('dropoff')) {
        return 'Return date must be after pickup date.';
      }
      return first.message || 'Invalid input provided.';
    }
  }

  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    if (error.message.startsWith('[{"') && error.message.includes('"message"')) {
      try {
        const parsed = JSON.parse(error.message);
        if (Array.isArray(parsed) && parsed[0]?.message) {
          const msg = parsed[0].message;
          if (msg.toLowerCase().includes('dropoff')) {
            return 'Return date must be after pickup date.';
          }
          return msg;
        }
      } catch {
        // fallback
      }
    }
    return error.message;
  }

  return 'An unexpected error occurred';
}

export function handleError(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'issues' in error &&
    Array.isArray((error as { issues: unknown[] }).issues)
  ) {
    return {
      status: 400,
      body: {
        success: false,
        error: formatErrorMessage(error),
      },
    };
  }

  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        success: false,
        error: formatErrorMessage(error),
      },
    };
  }

  if (error instanceof Error) {
    const message = formatErrorMessage(error);
    const isClientValidation = error.message.startsWith('[{"');
    return {
      status: isClientValidation ? 400 : 500,
      body: {
        success: false,
        error: message,
      },
    };
  }

  return {
    status: 500,
    body: {
      success: false,
      error: 'An unexpected error occurred',
    },
  };
}
