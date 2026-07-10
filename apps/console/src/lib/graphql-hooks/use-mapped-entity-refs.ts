'use client'

import { useMemo } from 'react'
import { useGetControlRelatedControls } from './control'

export type EntityRef = { id: string; refCode: string; href: string }

export const useMappedEntityRefs = (controlId?: string, subcontrolIds?: string[]) => {
  const subcontrolIdSet = useMemo(() => new Set(subcontrolIds ?? []), [subcontrolIds])

  const { data, isLoading } = useGetControlRelatedControls(controlId)

  const { mappedControlRefs, mappedSubcontrolRefs } = useMemo(() => {
    const controlRefs: EntityRef[] = []
    const subcontrolRefs: EntityRef[] = []
    const seenControls = new Set<string>()
    const seenSubcontrols = new Set<string>()

    const related = data?.control?.relatedControls ?? []
    related.forEach((node) => {
      if (!node?.id || !node?.refCode) return

      if (node.isSubcontrol) {
        if (subcontrolIdSet.has(node.id)) return
        if (seenSubcontrols.has(node.id)) return
        if (!node.parentControlID) return
        seenSubcontrols.add(node.id)
        subcontrolRefs.push({ id: node.id, refCode: node.refCode, href: `/controls/${node.parentControlID}/${node.id}` })
        return
      }

      if (node.id === controlId) return
      if (seenControls.has(node.id)) return
      seenControls.add(node.id)
      controlRefs.push({ id: node.id, refCode: node.refCode, href: `/controls/${node.id}` })
    })

    return { mappedControlRefs: controlRefs, mappedSubcontrolRefs: subcontrolRefs }
  }, [data, controlId, subcontrolIdSet])

  return { mappedControlRefs, mappedSubcontrolRefs, isLoading }
}
