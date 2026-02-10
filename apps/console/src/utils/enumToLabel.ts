export function objectToSnakeCase(object: string | undefined): string {
  if (!object) return ''
  return object
    .split(/(?=[A-Z])/)
    .join('_')
    .toLowerCase()
}
