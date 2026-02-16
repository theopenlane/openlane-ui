export function objectToSnakeCase(object: string | undefined): string {
  if (!object) return ''
  return object
    .split(/(?=[A-Z])/)
    .join('_')
    .toLowerCase()
}

export function toHumanLabel(input: string): string {
  if (!input) return ''

  return (
    input
      // Split acronym followed by normal word: APIToken → API Token
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      // Split lower-to-upper: DomainDelete → Domain Delete
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim()
  )
}

export function pluralizeTypeName(name: string): string {
  const lc = name.charAt(0).toLowerCase() + name.slice(1)
  if (lc.endsWith('y')) return lc.slice(0, -1) + 'ies'
  return lc + 's'
}
