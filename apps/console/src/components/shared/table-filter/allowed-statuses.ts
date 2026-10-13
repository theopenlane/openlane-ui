import { type StatusFilterableWhere } from './has-status-condition'

const collectAllowed = <TStatus extends string>(where: StatusFilterableWhere, candidates: TStatus[]): TStatus[] => {
  const { status, statusIn, statusNEQ, statusNotIn, statusIsNil, and, or } = where

  let allowed = candidates.filter(
    (value) =>
      statusIsNil !== true &&
      (status == null || value === status) &&
      (!statusIn?.length || statusIn.includes(value)) &&
      (statusNEQ == null || value !== statusNEQ) &&
      (!statusNotIn?.length || !statusNotIn.includes(value)),
  )

  and?.forEach((condition) => {
    allowed = collectAllowed(condition, allowed)
  })

  if (or?.length) {
    const union = or.flatMap((condition) => collectAllowed(condition, allowed))
    allowed = allowed.filter((value) => union.includes(value))
  }

  return allowed
}

export const resolveAllowedStatuses = <TStatus extends string>(where: StatusFilterableWhere | null | undefined, allStatuses: readonly TStatus[]): TStatus[] =>
  where ? collectAllowed(where, [...allStatuses]) : [...allStatuses]

export const whereAdmitsNullStatus = (where: StatusFilterableWhere | null | undefined): boolean => {
  if (!where) return true
  const { status, statusIn, statusNEQ, statusNotIn, and, or } = where
  if (status != null || statusIn?.length || statusNEQ != null || statusNotIn?.length) return false
  if (and?.some((condition) => !whereAdmitsNullStatus(condition))) return false
  return !or?.length || or.some(whereAdmitsNullStatus)
}

export const createStatusPredicate = <TStatus extends string>(where: StatusFilterableWhere | null | undefined, allStatuses: readonly TStatus[]) => {
  const allowed = new Set(resolveAllowedStatuses(where, allStatuses))
  const admitsNull = whereAdmitsNullStatus(where)
  return (status: TStatus | null | undefined): boolean => (status ? allowed.has(status) : admitsNull)
}
