import { auth } from '@/lib/auth/auth'
import { featureUtil } from '../plans'
import { type ObjectTypes } from '@repo/codegen/src/type-names'

export const hasFeature = async (objectType: ObjectTypes): Promise<boolean> => {
  const session = await auth()
  const featureEnabled = process.env.NEXT_PUBLIC_ENABLE_PLAN

  if (featureEnabled === 'false') {
    return true
  }

  if (!session) {
    return false
  }

  return featureUtil.hasObjectType(session.user?.modules ?? [], objectType, session)
}
