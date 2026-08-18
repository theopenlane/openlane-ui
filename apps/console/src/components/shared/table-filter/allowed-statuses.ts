import { type StatusFilterableWhere } from './has-status-condition'

const collectAllowed = <TStatus extends string>(where: StatusFilterableWhere, candidates: TStatus[]): TStatus[] => {
  const { status, statusIn, statusNEQ, statusNotIn, and, or } = where

  let allowed = candidates.filter(
    (value) =>
      (status == null || value === status) && (!statusIn?.length || statusIn.includes(value)) && (statusNEQ == null || value !== statusNEQ) && (!statusNotIn?.length || !statusNotIn.includes(value)),
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
