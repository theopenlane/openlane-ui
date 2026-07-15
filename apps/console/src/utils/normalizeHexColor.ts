const HEX_DIGITS = /^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const LEADING_HASHES = /^#+/

export const normalizeHexColor = (color?: string | null): string | null => {
  if (!color) return null
  const digits = color.trim().replace(LEADING_HASHES, '')
  if (!HEX_DIGITS.test(digits)) return null
  const expanded = digits.length === 3 ? digits.replace(/./g, (digit) => digit + digit) : digits
  return `#${expanded}`.toLowerCase()
}
