const isFileArray = (value: unknown): value is File[] => Array.isArray(value) && value.length > 0 && value.every((item) => item instanceof File)

export const buildGraphQLRequestBody = (query: string, variables: object = {}): { body: BodyInit; isMultipart: boolean } => {
  const files: File[] = []
  const fileMap: Record<string, string[]> = {}
  const operationVariables: Record<string, unknown> = { ...variables }

  Object.entries(variables).forEach(([key, value]) => {
    if (value instanceof File) {
      fileMap[files.length] = [`variables.${key}`]
      files.push(value)
      operationVariables[key] = null
    } else if (isFileArray(value)) {
      operationVariables[key] = value.map(() => null)
      value.forEach((file, index) => {
        fileMap[files.length] = [`variables.${key}.${index}`]
        files.push(file)
      })
    }
  })

  if (files.length === 0) {
    return { body: JSON.stringify({ query, variables }), isMultipart: false }
  }

  const formData = new FormData()
  formData.append('operations', JSON.stringify({ query, variables: operationVariables }))
  formData.append('map', JSON.stringify(fileMap))
  files.forEach((file, index) => formData.append(String(index), file))
  return { body: formData, isMultipart: true }
}
