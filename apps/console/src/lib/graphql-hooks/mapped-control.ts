import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type CreateMappedControlMutation,
  type CreateMappedControlMutationVariables,
  type DeleteMappedControlMutation,
  type DeleteMappedControlMutationVariables,
  type GetMappedControlByIdQuery,
  type GetAllMappedControlsQuery,
  type GetAllMappedControlsQueryVariables,
  type UpdateMappedControlMutation,
  type UpdateMappedControlMutationVariables,
  type MappedControlWhereInput,
  ControlControlStatus,
  EvidenceEvidenceStatus,
  MappedControlMappingSource,
} from '@repo/codegen/src/schema'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  CREATE_MAPPED_CONTROL,
  DELETE_MAPPED_CONTROL,
  GET_MAPPED_CONTROL_BY_ID,
  GET_ALL_MAPPED_CONTROLS,
  UPDATE_MAPPED_CONTROL,
  GET_MAPPED_CONTROLS_FOR_COVERAGE,
} from '@repo/codegen/query/mapped-control'
import { useMemo } from 'react'
import { type OrgCoverageData } from '@/components/pages/protected/control-report/org-coverage-cell'
import { ORG_COVERAGE_SEVERITY_ORDER } from '@/components/shared/enum-mapper/control-enum'
import { type ControlGroupItem } from './control'

type BuildLinkedControlsWhereArgs = {
  controlId?: string
  subcontrolId?: string
  refCode: string
  sourceFramework?: string | null
}

export const buildLinkedControlsWhere = ({ controlId, subcontrolId, refCode, sourceFramework }: BuildLinkedControlsWhereArgs): MappedControlWhereInput | undefined => {
  const isSubcontrolMode = !!subcontrolId
  const withFilter = sourceFramework ? { refCode, referenceFramework: sourceFramework } : { refCode, referenceFrameworkIsNil: true as const }
  const suggestedWhere = {
    and: [{ source: MappedControlMappingSource.SUGGESTED }, isSubcontrolMode ? { hasFromSubcontrolsWith: [withFilter] } : { hasFromControlsWith: [withFilter] }],
  }

  if (isSubcontrolMode && subcontrolId) {
    return { or: [suggestedWhere, { hasFromSubcontrolsWith: [{ id: subcontrolId }] }] }
  }

  if (controlId) {
    return {
      or: [
        suggestedWhere,
        { hasFromControlsWith: [{ id: controlId }] },
        { hasToControlsWith: [{ id: controlId }] },
        { hasFromSubcontrolsWith: [{ controlID: controlId }] },
        { hasToSubcontrolsWith: [{ controlID: controlId }] },
      ],
    }
  }

  return undefined
}

export const useCreateMappedControl = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateMappedControlMutation, unknown, CreateMappedControlMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_MAPPED_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
    },
  })
}

export const useGetMappedControls = ({ where, enabled = true }: { where: GetAllMappedControlsQueryVariables['where']; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllMappedControlsQuery>({
    queryKey: ['mappedControls', where],
    queryFn: () => client.request(GET_ALL_MAPPED_CONTROLS, { where }),
    enabled,
  })
}

export const useGetMappedControlById = ({ mappedControlId, enabled }: { mappedControlId?: string; enabled: boolean }) => {
  const { client } = useGraphQLClient()

  return useQuery<GetMappedControlByIdQuery, unknown>({
    queryKey: ['mappedControls', mappedControlId],
    queryFn: () => client.request(GET_MAPPED_CONTROL_BY_ID, { mappedControlId }),
    enabled,
  })
}

export const useUpdateMappedControl = () => {
  const { client } = useGraphQLClient()

  return useMutation<UpdateMappedControlMutation, unknown, UpdateMappedControlMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_MAPPED_CONTROL, variables),
  })
}

export const useDeleteMappedControl = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteMappedControlMutation, unknown, DeleteMappedControlMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_MAPPED_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
    },
  })
}

type CoverageEvidenceNode = {
  id: string
  name?: string | null
  status?: string | null
}

type CoverageControlNode = {
  id: string
  refCode: string
  referenceFramework?: string | null
  systemOwned?: boolean | null
  status?: string | null
  evidence?: { edges: Array<{ node: CoverageEvidenceNode | null } | null> | null } | null
  internalPolicies?: { edges: Array<{ node: { id: string; name: string } | null } | null> | null } | null
}

type CoverageSubcontrolNode = CoverageControlNode & { controlID: string }

type CoverageMappedControlEdge = {
  node: {
    fromControls: { edges: Array<{ node: CoverageControlNode | null } | null> | null }
    toControls: { edges: Array<{ node: CoverageControlNode | null } | null> | null }
    fromSubcontrols: { edges: Array<{ node: CoverageSubcontrolNode | null } | null> | null }
    toSubcontrols: { edges: Array<{ node: CoverageSubcontrolNode | null } | null> | null }
  }
} | null

type CoverageMappedControlResponse = {
  mappedControls: {
    pageInfo?: { endCursor: string | null; hasNextPage: boolean }
    edges: Array<CoverageMappedControlEdge> | null
  }
}

const INACTIVE_STATUSES = new Set<string>([ControlControlStatus.NOT_APPLICABLE, ControlControlStatus.ARCHIVED])

export const EVIDENCE_SEVERITY_ORDER: EvidenceEvidenceStatus[] = [
  EvidenceEvidenceStatus.REJECTED,
  EvidenceEvidenceStatus.MISSING_ARTIFACT,
  EvidenceEvidenceStatus.NEEDS_RENEWAL,
  EvidenceEvidenceStatus.REQUESTED,
  EvidenceEvidenceStatus.DRAFT,
  EvidenceEvidenceStatus.SUBMITTED,
  EvidenceEvidenceStatus.IN_REVIEW,
  EvidenceEvidenceStatus.READY_FOR_AUDITOR,
  EvidenceEvidenceStatus.AUDITOR_APPROVED,
]

type CoverageControlLike = {
  id: string
  refCode: string
  referenceFramework?: string | null
  status?: string | null
  evidence?: { edges?: Array<{ node?: { id: string; name?: string | null; status?: string | null } | null } | null> | null } | null
  internalPolicies?: { edges?: Array<{ node?: { id: string; name: string } | null } | null> | null } | null
}

const isOrgControl = (c: CoverageControlLike): boolean => !c.referenceFramework || c.referenceFramework === 'CUSTOM'

const addOrgControlToCoverage = (map: Map<string, OrgCoverageData & { seenIds: Set<string> }>, frameworkControlId: string, orgControl: CoverageControlLike) => {
  if (!orgControl.id || !orgControl.refCode) return
  let entry = map.get(frameworkControlId)
  if (!entry) {
    entry = {
      approvedCount: 0,
      activeCount: 0,
      worstStatus: null,
      orgControlRefs: [],
      seenIds: new Set(),
      evidenceTotalCount: 0,
      evidenceApprovedCount: 0,
      evidenceWorstStatus: null,
      evidenceCountByStatus: {},
      evidenceRefs: [],
      linkedPolicies: [],
    }
    map.set(frameworkControlId, entry)
  }
  if (entry.seenIds.has(orgControl.id)) return
  entry.seenIds.add(orgControl.id)

  const existingPolicyIds = new Set(entry.linkedPolicies.map((p) => p.id))
  for (const pEdge of orgControl.internalPolicies?.edges ?? []) {
    const p = pEdge?.node
    if (p && !existingPolicyIds.has(p.id)) {
      existingPolicyIds.add(p.id)
      entry.linkedPolicies.push({ id: p.id, name: p.name })
    }
  }

  entry.orgControlRefs.push({ id: orgControl.id, refCode: orgControl.refCode, status: orgControl.status })

  for (const evEdge of orgControl.evidence?.edges ?? []) {
    const ev = evEdge?.node
    if (!ev) continue
    entry.evidenceTotalCount++
    if (ev.status === EvidenceEvidenceStatus.AUDITOR_APPROVED) entry.evidenceApprovedCount++
    const evStatus = ev.status as EvidenceEvidenceStatus
    if (evStatus) {
      entry.evidenceCountByStatus[evStatus] = (entry.evidenceCountByStatus[evStatus] ?? 0) + 1
    }
    const currentEvidenceWorstIdx = entry.evidenceWorstStatus ? EVIDENCE_SEVERITY_ORDER.indexOf(entry.evidenceWorstStatus) : EVIDENCE_SEVERITY_ORDER.length
    const evIdx = EVIDENCE_SEVERITY_ORDER.indexOf(evStatus)
    if (evIdx !== -1 && evIdx < currentEvidenceWorstIdx) {
      entry.evidenceWorstStatus = EVIDENCE_SEVERITY_ORDER[evIdx]
    }
    entry.evidenceRefs.push({ id: ev.id, name: ev.name ?? ev.id, status: ev.status, controlId: orgControl.id })
  }

  const status = orgControl.status ?? ''
  if (INACTIVE_STATUSES.has(status)) return

  entry.activeCount++
  if (status === ControlControlStatus.APPROVED) entry.approvedCount++

  const currentWorstIdx = entry.worstStatus ? ORG_COVERAGE_SEVERITY_ORDER.indexOf(entry.worstStatus) : ORG_COVERAGE_SEVERITY_ORDER.length
  const newIdx = ORG_COVERAGE_SEVERITY_ORDER.indexOf(status as ControlControlStatus)
  if (newIdx !== -1 && newIdx < currentWorstIdx) {
    entry.worstStatus = ORG_COVERAGE_SEVERITY_ORDER[newIdx]
  }
}

export const buildOrgCoverageMap = (controls: ControlGroupItem[]): Map<string, OrgCoverageData> => {
  const raw = new Map<string, OrgCoverageData & { seenIds: Set<string> }>()

  for (const control of controls) {
    for (const node of [...control.relatedControls, ...control.relatedSubcontrols]) {
      if (isOrgControl(node)) addOrgControlToCoverage(raw, control.id, node)
    }
  }

  const result = new Map<string, OrgCoverageData>()
  for (const [id, { seenIds: _seenIds, ...rest }] of raw) {
    result.set(id, rest)
  }
  return result
}

export type FrameworkCoverageData = {
  frameworkControlRefs: Array<{ id: string; refCode: string; framework: string }>
  evidenceRefs: Array<{ id: string; name: string; status?: string | null; controlId: string }>
  linkedPolicies: Array<{ id: string; name: string }>
}

const isFrameworkControl = (c: CoverageControlLike): boolean => !!(c.referenceFramework && c.referenceFramework !== 'CUSTOM')

export const buildFrameworkCoverageMap = (controls: ControlGroupItem[]): Map<string, FrameworkCoverageData> => {
  type Entry = {
    refs: Array<{ id: string; refCode: string; framework: string }>
    evidenceRefs: Array<{ id: string; name: string; status?: string | null; controlId: string }>
    linkedPolicies: Array<{ id: string; name: string }>
    seenIds: Set<string>
    seenEvidenceIds: Set<string>
    seenPolicyIds: Set<string>
  }
  const raw = new Map<string, Entry>()

  const addFrameworkRef = (orgControlId: string, fc: CoverageControlLike) => {
    if (!fc.id || !fc.refCode || !fc.referenceFramework) return
    let entry = raw.get(orgControlId)
    if (!entry) {
      entry = { refs: [], evidenceRefs: [], linkedPolicies: [], seenIds: new Set(), seenEvidenceIds: new Set(), seenPolicyIds: new Set() }
      raw.set(orgControlId, entry)
    }
    if (!entry.seenIds.has(fc.id)) {
      entry.seenIds.add(fc.id)
      entry.refs.push({ id: fc.id, refCode: fc.refCode, framework: fc.referenceFramework })
    }
    for (const evEdge of fc.evidence?.edges ?? []) {
      const ev = evEdge?.node
      if (!ev || entry.seenEvidenceIds.has(ev.id)) continue
      entry.seenEvidenceIds.add(ev.id)
      entry.evidenceRefs.push({ id: ev.id, name: ev.name ?? ev.id, status: ev.status, controlId: fc.id })
    }
    for (const pEdge of fc.internalPolicies?.edges ?? []) {
      const p = pEdge?.node
      if (!p || entry.seenPolicyIds.has(p.id)) continue
      entry.seenPolicyIds.add(p.id)
      entry.linkedPolicies.push({ id: p.id, name: p.name })
    }
  }

  for (const control of controls) {
    for (const node of [...control.relatedControls, ...control.relatedSubcontrols]) {
      if (isFrameworkControl(node)) addFrameworkRef(control.id, node)
    }
  }

  const result = new Map<string, FrameworkCoverageData>()
  for (const [id, { seenIds: _seenIds, seenEvidenceIds: _seenEvidenceIds, seenPolicyIds: _seenPolicyIds, refs, evidenceRefs, linkedPolicies }] of raw) {
    result.set(id, { frameworkControlRefs: refs, evidenceRefs, linkedPolicies })
  }
  return result
}

export const useFrameworkCoverageForSubcontrol = (subcontrolId?: string): FrameworkCoverageData | null => {
  const { client } = useGraphQLClient()

  const where = useMemo(() => (subcontrolId ? { or: [{ hasFromSubcontrolsWith: [{ id: subcontrolId }] }, { hasToSubcontrolsWith: [{ id: subcontrolId }] }] } : undefined), [subcontrolId])

  const { data } = useQuery<CoverageMappedControlResponse>({
    queryKey: ['mappedControls', 'frameworkCoverage', 'subcontrol', subcontrolId],
    queryFn: () => client.request<CoverageMappedControlResponse>(GET_MAPPED_CONTROLS_FOR_COVERAGE, { where }),
    enabled: !!subcontrolId,
  })

  return useMemo(() => {
    if (!data || !subcontrolId) return null

    const refs: Array<{ id: string; refCode: string; framework: string }> = []
    const seenIds = new Set<string>()
    const evidenceRefs: Array<{ id: string; name: string; status?: string | null; controlId: string }> = []
    const seenEvidenceIds = new Set<string>()
    const linkedPolicies: Array<{ id: string; name: string }> = []
    const seenPolicyIds = new Set<string>()

    for (const edge of data.mappedControls.edges ?? []) {
      const node = edge?.node
      if (!node) continue

      const fromControls = (node.fromControls.edges ?? []).map((e) => e?.node).filter((n): n is CoverageControlNode => !!n)
      const toControls = (node.toControls.edges ?? []).map((e) => e?.node).filter((n): n is CoverageControlNode => !!n)
      const fromSubcontrols = (node.fromSubcontrols.edges ?? []).map((e) => e?.node).filter((n): n is CoverageSubcontrolNode => !!n)
      const toSubcontrols = (node.toSubcontrols.edges ?? []).map((e) => e?.node).filter((n): n is CoverageSubcontrolNode => !!n)

      const isTargetInFrom = fromSubcontrols.some((s) => s.id === subcontrolId)
      const isTargetInTo = toSubcontrols.some((s) => s.id === subcontrolId)

      const candidates: CoverageControlNode[] = isTargetInFrom
        ? [...toControls, ...toSubcontrols.filter((s) => s.id !== subcontrolId)]
        : isTargetInTo
          ? [...fromControls, ...fromSubcontrols.filter((s) => s.id !== subcontrolId)]
          : []

      for (const sc of candidates) {
        if (!isFrameworkControl(sc) || !sc.refCode || !sc.referenceFramework) continue
        if (!seenIds.has(sc.id)) {
          seenIds.add(sc.id)
          refs.push({ id: sc.id, refCode: sc.refCode, framework: sc.referenceFramework })
        }
        for (const evEdge of sc.evidence?.edges ?? []) {
          const ev = evEdge?.node
          if (!ev || seenEvidenceIds.has(ev.id)) continue
          seenEvidenceIds.add(ev.id)
          evidenceRefs.push({ id: ev.id, name: ev.name ?? ev.id, status: ev.status, controlId: sc.id })
        }
        for (const pEdge of sc.internalPolicies?.edges ?? []) {
          const p = pEdge?.node
          if (!p || seenPolicyIds.has(p.id)) continue
          seenPolicyIds.add(p.id)
          linkedPolicies.push({ id: p.id, name: p.name })
        }
      }
    }

    if (refs.length === 0) return null
    return { frameworkControlRefs: refs, evidenceRefs, linkedPolicies }
  }, [data, subcontrolId])
}

export const useOrgCoverageForSubcontrol = (subcontrolId?: string): OrgCoverageData | null => {
  const { client } = useGraphQLClient()

  const where = useMemo(() => (subcontrolId ? { or: [{ hasFromSubcontrolsWith: [{ id: subcontrolId }] }, { hasToSubcontrolsWith: [{ id: subcontrolId }] }] } : undefined), [subcontrolId])

  const { data } = useQuery<CoverageMappedControlResponse>({
    queryKey: ['mappedControls', 'coverage', 'subcontrol', subcontrolId],
    queryFn: () => client.request<CoverageMappedControlResponse>(GET_MAPPED_CONTROLS_FOR_COVERAGE, { where }),
    enabled: !!subcontrolId,
  })

  return useMemo(() => {
    if (!data || !subcontrolId) return null

    const raw = new Map<string, OrgCoverageData & { seenIds: Set<string> }>()
    const sentinel = '__subcontrol__'

    for (const edge of data.mappedControls.edges ?? []) {
      const node = edge?.node
      if (!node) continue

      const fromControls = (node.fromControls.edges ?? []).map((e) => e?.node).filter((n): n is CoverageControlNode => !!n)
      const toControls = (node.toControls.edges ?? []).map((e) => e?.node).filter((n): n is CoverageControlNode => !!n)
      const fromSubcontrols = (node.fromSubcontrols.edges ?? []).map((e) => e?.node).filter((n): n is CoverageSubcontrolNode => !!n)
      const toSubcontrols = (node.toSubcontrols.edges ?? []).map((e) => e?.node).filter((n): n is CoverageSubcontrolNode => !!n)

      const isTargetInFrom = fromSubcontrols.some((s) => s.id === subcontrolId)
      const isTargetInTo = toSubcontrols.some((s) => s.id === subcontrolId)

      if (isTargetInFrom) {
        for (const oc of [...toControls, ...toSubcontrols.filter((s) => s.id !== subcontrolId)]) {
          if (isOrgControl(oc)) addOrgControlToCoverage(raw, sentinel, oc)
        }
      }
      if (isTargetInTo) {
        for (const oc of [...fromControls, ...fromSubcontrols.filter((s) => s.id !== subcontrolId)]) {
          if (isOrgControl(oc)) addOrgControlToCoverage(raw, sentinel, oc)
        }
      }
    }

    const entry = raw.get(sentinel)
    if (!entry) return null
    const { seenIds: _seenIds, ...result } = entry
    return result
  }, [data, subcontrolId])
}
