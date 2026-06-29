'use client'

import type { EntityRef } from '@/lib/graphql-hooks/use-mapped-entity-refs'

export type { EntityRef }

export const buildAssociationFilter = (controlId?: string, subcontrolIds: string[] = [], mappedControlRefs: EntityRef[] = [], mappedSubcontrolRefs: EntityRef[] = []) => {
  const conditions: object[] = []

  if (controlId) conditions.push({ hasControlsWith: [{ id: controlId }] })
  if (subcontrolIds.length > 0) conditions.push({ hasSubcontrolsWith: [{ idIn: subcontrolIds }] })

  const mappedControlIds = mappedControlRefs.map((r) => r.id)
  const mappedSubcontrolIds = mappedSubcontrolRefs.map((r) => r.id)

  if (mappedControlIds.length > 0) conditions.push({ hasControlsWith: [{ idIn: mappedControlIds }] })
  if (mappedSubcontrolIds.length > 0) conditions.push({ hasSubcontrolsWith: [{ idIn: mappedSubcontrolIds }] })

  if (conditions.length === 0) return {}
  if (conditions.length === 1) return conditions[0]
  return { or: conditions }
}
