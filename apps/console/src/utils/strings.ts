export function objectToSnakeCase(object: string | undefined): string {
  if (!object) return ''
  return object
    .split(/(?=[A-Z])/)
    .join('_')
    .toLowerCase()
}

export function toHumanLabel(input: string): string {
  if (!input) return ''

  const label = input
    // Replace underscores and dashes with spaces: api_key → api key
    .replace(/[_-]+/g, ' ')
    // Split acronym followed by normal word: APIToken → API Token
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    // Split lower-to-upper: DomainDelete → Domain Delete
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim()

  return label.replace(/\b\w/g, (char) => char.toUpperCase())
}

export function formatPhoneNumber(value?: string | null): string {
  if (!value) return ''

  const digits = value.replace(/\D/g, '')

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }

  return value
}

// if you change this, update packages/codegen/plugins/lib.js:pluralizeTypeName also
export function pluralizeTypeName(name: string): string {
  const lc = name.charAt(0).toLowerCase() + name.slice(1)
  if (/(?:s|x|z|ch|sh)$/.test(lc)) return lc + 'es'
  if (/[bcdfghjklmnpqrstvwxyz]y$/.test(lc)) return lc.slice(0, -1) + 'ies'
  return lc + 's'
}
