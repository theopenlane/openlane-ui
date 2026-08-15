'use client'

import { useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { type PlanEnum } from '@/lib/subscription-plan/plan-enum'
import { featureUtil } from '@/lib/subscription-plan/plans'
import { type NavItem } from '@/types'

export const useModuleAccess = () => {
  const { data: session } = useSession()
  const modules = useMemo(() => session?.user?.modules ?? [], [session?.user?.modules])

  const hasModule = useCallback((module: PlanEnum) => featureUtil.hasModule(modules, module, session), [modules, session])

  const hasObjectType = useCallback((objectType: ObjectTypes) => featureUtil.hasObjectType(modules, objectType, session), [modules, session])

  return useMemo(() => ({ modules, hasModule, hasObjectType }), [modules, hasModule, hasObjectType])
}

export const useHasObjectType = (objectType: ObjectTypes) => {
  const { hasObjectType } = useModuleAccess()
  return hasObjectType(objectType)
}

export const useHasModule = (module: PlanEnum) => {
  const { hasModule } = useModuleAccess()
  return hasModule(module)
}

export const useIsNavItemLocked = () => {
  const { hasModule, hasObjectType } = useModuleAccess()

  return useCallback(
    function isLocked(item: NavItem): boolean {
      if (item.objectType) {
        return !hasObjectType(item.objectType)
      }

      if (item.plan) {
        return !hasModule(item.plan)
      }

      const visibleChildren = (item.children ?? []).filter((child) => !child.hidden)

      return visibleChildren.length > 0 && visibleChildren.every(isLocked)
    },
    [hasModule, hasObjectType],
  )
}
