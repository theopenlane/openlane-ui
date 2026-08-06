export const mergeWhere = <T extends { and?: T[] | null | undefined }>(conditions: Array<T | null | undefined>): T => {
  const valid = conditions.filter((condition): condition is T => !!condition && Object.keys(condition).length > 0)
  if (valid.length === 0) return {} as T
  if (valid.length === 1) return valid[0]
  return { and: valid } as T
}
