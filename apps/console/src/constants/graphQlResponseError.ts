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
  NOT_FOUND: 'Resource could not be found.',
  VALIDATION_ERROR: 'Validation failed. One or more fields are incorrect or missing.',
  CONFLICT: `We couldn’t complete your request due to a conflict. The item you're trying to reference may not exist or is already in use.`,
  INTERNAL_SERVER_ERROR: 'Internal server error. Please try again later or reach out to support for assistance.',
  UNAUTHORIZED: 'You are not authorized to perform this request. Reach out to an organization admin for assistance.',
  ALREADY_EXISTS: 'Item already exists. If you’re trying to update it, double-check the details. Otherwise, try a new name or value.',
  MAX_ATTEMPTS: 'Max attempts to resend email reached, please create a new request or reach out to support.',
  BAD_REQUEST: 'Something’s not right. Please check your input and try again.',
}
