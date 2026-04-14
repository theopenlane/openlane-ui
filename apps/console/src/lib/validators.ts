export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const isUlid = (value: string): boolean => {
  return /^[0-9A-Z]{26}$/i.test(value)
}
