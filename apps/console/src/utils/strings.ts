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
    // Split acronym followed by normal word: APIToken → API Token
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    // Split lower-to-upper: DomainDelete → Domain Delete
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()

  return label.charAt(0).toUpperCase() + label.slice(1)
}

// if you change this, update packages/codegen/plugins/lib.js:pluralizeTypeName also
export function pluralizeTypeName(name: string): string {
  const lc = name.charAt(0).toLowerCase() + name.slice(1)
  if (/(?:s|x|z|ch|sh)$/.test(lc)) return lc + 'es'
  if (/[bcdfghjklmnpqrstvwxyz]y$/.test(lc)) return lc.slice(0, -1) + 'ies'
  return lc + 's'
}
