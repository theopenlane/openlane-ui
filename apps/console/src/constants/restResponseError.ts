export const ERROR_MESSAGES: Record<string, string> = {
  INVALID_INPUT: 'email address is not allowed, please use your corporate email address',
}

export const getErrorMessage = (code: string): string => {
  return ERROR_MESSAGES[code] ?? code
}
