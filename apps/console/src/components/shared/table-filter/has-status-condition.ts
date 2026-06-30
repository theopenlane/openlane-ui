export interface StatusFilterableWhere {
  status?: string | null
  statusNEQ?: string | null
  statusIn?: string[] | null
  statusNotIn?: string[] | null
  and?: StatusFilterableWhere[] | null
  or?: StatusFilterableWhere[] | null
}

export const hasStatusCondition = (where: StatusFilterableWhere): boolean => {
  if ('status' in where || 'statusNEQ' in where || 'statusIn' in where || 'statusNotIn' in where) return true
  if (Array.isArray(where.and) && where.and.some(hasStatusCondition)) return true
  if (Array.isArray(where.or) && where.or.some(hasStatusCondition)) return true
  return false
}
