export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const normalizeEmail = (email: string): string => email.trim().toLowerCase()

export const isDuplicateEmail = (email: string, existing: string[]): boolean => {
  const key = normalizeEmail(email)
  return existing.some((current) => normalizeEmail(current) === key)
}

export const dedupeEmails = (emails: string[]): string[] => {
  const seen = new Set<string>()
  return emails.filter((email) => {
    const key = normalizeEmail(email)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

export const isUlid = (value: string): boolean => {
  return /^[0-9A-Z]{26}$/i.test(value)
}
