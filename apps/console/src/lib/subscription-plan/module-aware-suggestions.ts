import { type Session } from 'next-auth'
import { type PlanEnum } from '@/lib/subscription-plan/plan-enum'
import { featureUtil } from '@/lib/subscription-plan/plans'

export type ModuleGatedItem = {
  key: string
  title: string
  description: string
  requiredModule?: PlanEnum
  // shown instead of `description` on the collapsed "get this module" backup item --
  // written to read naturally on its own, since titles are action phrases ("Configure
  // your Trust Center") that don't grammatically fit into a generated sentence
  fallbackDescription?: string
  onClick: () => void
}

// Suggestions whose requiredModule the org doesn't have are collapsed into a single "get this module" item per missing module
export const applyModuleGating = <T extends ModuleGatedItem>(items: T[], userModules: PlanEnum[], session: Session | null | undefined, goToBilling: () => void): T[] => {
  const available: T[] = []
  const missingByModule = new Map<PlanEnum, T[]>()

  items.forEach((item) => {
    if (!item.requiredModule || featureUtil.hasModule(userModules, item.requiredModule, session)) {
      available.push(item)
      return
    }

    missingByModule.set(item.requiredModule, [...(missingByModule.get(item.requiredModule) ?? []), item])
  })

  const moduleBackups = Array.from(missingByModule.entries()).map(([plan, gatedItems]) => {
    const moduleName = featureUtil.getPlanName(plan)

    return {
      ...gatedItems[0],
      key: `get-module-${plan}`,
      title: `Get the ${moduleName} module`,
      description: gatedItems.map((item) => item.fallbackDescription ?? item.description).join(' '),
      onClick: goToBilling,
    }
  })

  return [...available, ...moduleBackups]
}
