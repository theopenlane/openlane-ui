import { Session } from 'next-auth'

export function hasNoModules(session: Session | null): boolean {
  if (!session) {
    return false
  }
  const featureEnabled = process.env.NEXT_PUBLIC_ENABLE_PLAN

  if (featureEnabled === 'false') {
    return false
  }

  const modules = session.user?.modules ?? []

  return modules.length === 0
}
