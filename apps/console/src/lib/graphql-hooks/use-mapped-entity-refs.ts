'use client'

import { useMemo } from 'react'
import type { ControlByIdNode } from './control'

export type EntityRef = { id: string; refCode: string; href: string }

export const useMappedEntityRefs = (control?: ControlByIdNode) => {
  return useMemo(() => {
    const mappedControlRefs: EntityRef[] = []
    const mappedSubcontrolRefs: EntityRef[] = []

    ;(control?.relatedControls?.edges ?? []).forEach((edge) => {
      const node = edge?.node
      if (!node?.id || !node?.refCode) return
      mappedControlRefs.push({ id: node.id, refCode: node.refCode, href: `/controls/${node.id}` })
    })
    ;(control?.relatedSubcontrols?.edges ?? []).forEach((edge) => {
      const node = edge?.node
      if (!node?.id || !node?.refCode || !node?.controlID) return
      mappedSubcontrolRefs.push({ id: node.id, refCode: node.refCode, href: `/controls/${node.controlID}/${node.id}` })
    })

    return { mappedControlRefs, mappedSubcontrolRefs, isLoading: false }
  }, [control])
}
