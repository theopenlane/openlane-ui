// toHumanLabel converts a string like 'APIToken' to 'Api token' for better readability in generated code
export function toHumanLabel(input) {
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

export function toUpperSnake(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') // camel/Pascal -> snake
    .replace(/[-\s]/g, '_')
    .toUpperCase()
}

export function getObjectNameFromBody(body) {
  if (/\brefCode\b/.test(body)) return 'refCode'
  if (/\bname\b/.test(body)) return 'name'
  if (/\btitle\b/.test(body)) return 'title'
  return 'name'
}

export function toKebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

export function pluralizeTypeName(name) {
  const lc = name.charAt(0).toLowerCase() + name.slice(1)
  if (lc.endsWith('y')) return lc.slice(0, -1) + 'ies'
  return lc + 's'
}

export function getQueryNameFor(typeName) {
  const pluralLc = pluralizeTypeName(typeName)
  return `GET_ALL_${toUpperSnake(pluralLc)}`
}

export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}
