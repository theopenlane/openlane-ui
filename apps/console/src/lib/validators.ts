export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const isDuplicateEmail = (email: string, existing: string[]): boolean => {
  const key = email.toLowerCase()
  return existing.some((current) => current.toLowerCase() === key)
}

export const dedupeEmails = (emails: string[]): string[] => {
  const seen = new Set<string>()
  return emails.filter((email) => {
    const key = email.toLowerCase()
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
