'use client'

import { useMemo } from 'react'
import { useGetMappedControls } from './mapped-control'

export type EntityRef = { id: string; refCode: string; href: string }

export const useMappedEntityRefs = (controlId?: string, subcontrolIds?: string[]) => {
  const subcontrolIdSet = useMemo(() => new Set(subcontrolIds ?? []), [subcontrolIds])

  const where = useMemo(() => {
    if (!controlId) return undefined
    return {
      or: [
        { hasFromControlsWith: [{ id: controlId }] },
        { hasToControlsWith: [{ id: controlId }] },
        { hasFromSubcontrolsWith: [{ controlID: controlId }] },
        { hasToSubcontrolsWith: [{ controlID: controlId }] },
      ],
    }
  }, [controlId])

  const { data, isLoading } = useGetMappedControls({ where, enabled: Boolean(controlId) })

  const { mappedControlRefs, mappedSubcontrolRefs } = useMemo(() => {
    const controlRefs: EntityRef[] = []
    const subcontrolRefs: EntityRef[] = []
    const seenControls = new Set<string>()
    const seenSubcontrols = new Set<string>()

    const edges = data?.mappedControls?.edges ?? []
    edges.forEach((edge) => {
      const node = edge?.node
      if (!node) return

      const allControls = [...(node.fromControls?.edges ?? []).map((e) => e?.node), ...(node.toControls?.edges ?? []).map((e) => e?.node)]
      const allSubcontrols = [...(node.fromSubcontrols?.edges ?? []).map((e) => e?.node), ...(node.toSubcontrols?.edges ?? []).map((e) => e?.node)]

      allControls.forEach((c) => {
        if (!c?.id || !c?.refCode) return
        if (c.id === controlId) return
        if (seenControls.has(c.id)) return
        seenControls.add(c.id)
        controlRefs.push({ id: c.id, refCode: c.refCode, href: `/controls/${c.id}` })
      })

      allSubcontrols.forEach((s) => {
        if (!s?.id || !s?.refCode) return
        if (subcontrolIdSet.has(s.id)) return
        if (seenSubcontrols.has(s.id)) return
        seenSubcontrols.add(s.id)
        subcontrolRefs.push({ id: s.id, refCode: s.refCode, href: `/controls/${s.controlID}/${s.id}` })
      })
    })

    return { mappedControlRefs: controlRefs, mappedSubcontrolRefs: subcontrolRefs }
  }, [data, controlId, subcontrolIdSet])

  return { mappedControlRefs, mappedSubcontrolRefs, isLoading }
}
