export function formatEnumLabel(value: string) {
  const sentence = value.toLowerCase().replace(/_/g, ' ')
  return sentence.charAt(0).toUpperCase() + sentence.slice(1)
}
