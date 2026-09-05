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

  const hasAnyModule = useCallback((requiredModules: PlanEnum | PlanEnum[]) => featureUtil.hasAnyModule(modules, requiredModules, session), [modules, session])

  const hasObjectType = useCallback((objectType: ObjectTypes) => featureUtil.hasObjectType(modules, objectType, session), [modules, session])

  return useMemo(() => ({ modules, hasModule, hasAnyModule, hasObjectType }), [modules, hasModule, hasAnyModule, hasObjectType])
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
  const { hasAnyModule, hasObjectType } = useModuleAccess()

  return useCallback(
    (item: NavItem): boolean => {
      const locked = (candidate: NavItem): boolean => {
        const requiredPlans = candidate.plan ? featureUtil.toModules(candidate.plan) : []

        if (requiredPlans.length > 0 && !hasAnyModule(requiredPlans)) {
          return true
        }

        if (candidate.objectType && !hasObjectType(candidate.objectType)) {
          return true
        }

        if (requiredPlans.length > 0 || candidate.objectType) {
          return false
        }

        const visibleChildren = (candidate.children ?? []).filter((child) => !child.hidden)

        return visibleChildren.length > 0 && visibleChildren.every((child) => locked(child))
      }

      return locked(item)
    },
    [hasAnyModule, hasObjectType],
  )
}
