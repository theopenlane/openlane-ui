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

export const isPlausiblePhoneNumber = (phoneNumber: string): boolean => {
  const value = phoneNumber.trim()
  if (!value) return true
  if (!/^\+?[\d\s().-]+$/.test(value)) return false
  if (value.startsWith('+0')) return false

  const digitCount = value.replace(/\D/g, '').length
  return digitCount >= 7 && digitCount <= 15
}

export const isUlid = (value: string): boolean => {
  return /^[0-9A-Z]{26}$/i.test(value)
}
