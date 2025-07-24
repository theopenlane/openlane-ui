export enum GraphQlResponseError {
  NotFoundErrorCode = 'NOT_FOUND',
  ValidationErrorCode = 'VALIDATION_ERROR',
  ConflictErrorCode = 'CONFLICT',
  InternalServerErrorCode = 'INTERNAL_SERVER_ERROR',
  UnauthorizedErrorCode = 'UNAUTHORIZED',
  AlreadyExistsErrorCode = 'ALREADY_EXISTS',
  MaxAttemptsErrorCode = 'MAX_ATTEMPTS',
  BadRequestErrorCode = 'BAD_REQUEST',
}

export const errorCodeMessages: Record<string, string> = {
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Validation failed. Please check your input.',
  CONFLICT: 'A conflict occurred. This item may already exist.',
  INTERNAL_SERVER_ERROR: 'Internal server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized.',
  ALREADY_EXISTS: 'This item already exists.',
  MAX_ATTEMPTS: 'Too many attempts. Try again later.',
  BAD_REQUEST: 'Bad request. Please verify your data.',
}
