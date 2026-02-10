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

export function toEnumKey(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') // camel/Pascal -> snake
    .replace(/[-\s]/g, '_')
    .toUpperCase()
}
