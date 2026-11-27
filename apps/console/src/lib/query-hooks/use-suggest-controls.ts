import { useEffect, useMemo } from 'react'
import { type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query'
import { type GraphQLClient } from 'graphql-request'
import { GET_CONTROL_SUGGESTION_CANDIDATES } from '@repo/codegen/query/control'
import { GET_CONTROL_SUGGESTION_MAPPINGS } from '@repo/codegen/query/mapped-control'
import { GET_SUBCONTROL_SUGGESTION_CANDIDATES } from '@repo/codegen/query/subcontrol'
import {
  ControlControlStatus,
  SubcontrolControlStatus,
  type ControlWhereInput,
  type GetControlRelatedControlsQuery,
  type GetControlSuggestionCandidatesQuery,
  type GetControlSuggestionCandidatesQueryVariables,
  type GetControlSuggestionMappingsQuery,
  type GetControlSuggestionMappingsQueryVariables,
  type GetSubcontrolRelatedControlsQuery,
  type GetSubcontrolSuggestionCandidatesQuery,
  type GetSubcontrolSuggestionCandidatesQueryVariables,
  type MappedControlMappingType,
  type MappedControlWhereInput,
  type SubcontrolWhereInput,
  type SuggestionMappedControlFieldsFragment,
  type SuggestionMappedSubcontrolFieldsFragment,
} from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { MAX_CONNECTION_RESULTS } from '@/constants/pagination'
import { OPENLANE_TRUST_CENTER_STANDARD } from '@/constants/system-standards'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useOrganization } from '@/hooks/useOrganization'
import { useHasObjectType } from '@/lib/subscription-plan/hooks/use-module-access'
import {
  controlSuggestionsResponseSchema,
  MAX_SUGGESTION_CANDIDATES,
  MAX_SUGGESTION_DETAILS_LENGTH,
  toCandidateDescription,
  toCandidateLabel,
  type TControlSuggestionCandidate,
} from '@/lib/control-suggestions/schema'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { useGetControlRelatedControls } from '@/lib/graphql-hooks/control'
import { useGetSubcontrolRelatedControls } from '@/lib/graphql-hooks/subcontrol'
import { fetchAllConnectionNodes } from '@/lib/graphql-hooks/fetch-all-connection-nodes'
import { compareNatural } from '@/lib/sort'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'

const SUGGESTIONS_STALE_TIME_MS = 10 * 60 * 1000 // 10min
const SUGGESTIONS_KEY = 'controlSuggestions'
const CANDIDATES_KEY = 'controlSuggestionCandidates'
const SOURCE_QUERY_ROOTS: ReadonlySet<unknown> = new Set(['controls', 'subcontrols', 'mappedControls'])

export type TSuggestedControl = {
  id: string
  refCode: string
  title?: string | null
  referenceFramework?: string | null
  parentControlId?: string
}

export type TSuggestedMapping = TSuggestedControl & { mappingType: MappedControlMappingType }

export type TSuggestionGroup = {
  control: TSuggestedControl
  mapped: TSuggestedMapping[]
}

export type TSuggestionSource = 'organization' | 'framework'

export type TControlSuggestions = {
  source: TSuggestionSource
  groups: TSuggestionGroup[]
  isPartial: boolean
}

type TCandidate = TSuggestedControl & { description?: string | null }

type TCandidatePool = {
  candidates: TCandidate[]
  isPartial: boolean
}

type TMappingNode = NonNullable<NonNullable<NonNullable<GetControlSuggestionMappingsQuery['mappedControls']['edges']>[number]>['node']>

type TControlFields = SuggestionMappedControlFieldsFragment | SuggestionMappedSubcontrolFieldsFragment

const INACTIVE_CONTROL_STATUSES = [ControlControlStatus.ARCHIVED, ControlControlStatus.NOT_APPLICABLE]

const CONTROL_ELIGIBILITY: ControlWhereInput = {
  systemOwned: false,
  isTrustCenterControl: false,
  or: [{ statusIsNil: true }, { statusNotIn: INACTIVE_CONTROL_STATUSES }],
}

const SUBCONTROL_ELIGIBILITY: SubcontrolWhereInput = {
  or: [{ statusIsNil: true }, { statusNotIn: [SubcontrolControlStatus.ARCHIVED, SubcontrolControlStatus.NOT_APPLICABLE] }],
}

const SOURCE_FRAMEWORK_FILTER: Record<TSuggestionSource, ControlWhereInput> = {
  organization: { referenceFrameworkIsNil: true },
  framework: { referenceFrameworkNotNil: true },
}

const toSuggestedControl = (node: TControlFields): TSuggestedControl => ({
  id: node.id,
  refCode: node.refCode,
  title: node.title,
  referenceFramework: node.referenceFramework,
  parentControlId: 'control' in node ? node.control.id : undefined,
})

export const partitionByParent = (controls: TSuggestedControl[]) => ({
  controlIds: controls.filter(({ parentControlId }) => !parentControlId).map(({ id }) => id),
  subcontrolIds: controls.filter(({ parentControlId }) => parentControlId).map(({ id }) => id),
})

const fetchCandidatePool = async (client: GraphQLClient, source: TSuggestionSource): Promise<TCandidatePool> => {
  const controlWhere: ControlWhereInput = { ...CONTROL_ELIGIBILITY, ...SOURCE_FRAMEWORK_FILTER[source] }
  let controlTotal = 0
  let subcontrolTotal = 0

  const controls = await fetchAllConnectionNodes(async (after, remaining) => {
    const data = await client.request<GetControlSuggestionCandidatesQuery, GetControlSuggestionCandidatesQueryVariables>(GET_CONTROL_SUGGESTION_CANDIDATES, {
      where: controlWhere,
      first: Math.min(MAX_CONNECTION_RESULTS, remaining),
      after,
    })
    controlTotal = data.controls.totalCount
    return data.controls
  }, MAX_SUGGESTION_CANDIDATES)

  const subcontrols = await fetchAllConnectionNodes(async (after, remaining) => {
    const data = await client.request<GetSubcontrolSuggestionCandidatesQuery, GetSubcontrolSuggestionCandidatesQueryVariables>(GET_SUBCONTROL_SUGGESTION_CANDIDATES, {
      where: { ...SUBCONTROL_ELIGIBILITY, hasControlWith: [controlWhere] },
      first: Math.max(1, Math.min(MAX_CONNECTION_RESULTS, remaining)),
      after,
    })
    subcontrolTotal = data.subcontrols.totalCount
    return data.subcontrols
  }, MAX_SUGGESTION_CANDIDATES - controls.length)

  const candidates = [...controls, ...subcontrols].map((node) => ({ ...toSuggestedControl(node), description: node.description }))
  return { candidates, isPartial: controlTotal + subcontrolTotal > candidates.length }
}

const getCandidatePool = (queryClient: QueryClient, client: GraphQLClient, organizationId: string | undefined, source: TSuggestionSource) =>
  queryClient.fetchQuery({
    queryKey: [CANDIDATES_KEY, organizationId, source],
    queryFn: () => fetchCandidatePool(client, source),
    staleTime: SUGGESTIONS_STALE_TIME_MS,
    gcTime: SUGGESTIONS_STALE_TIME_MS,
  })

const readError = async (response: Response): Promise<string> => {
  const body: { error?: string } | null = await response.json().catch(() => null)
  return body?.error ?? 'Failed to suggest controls'
}

const matchCandidates = async (details: string, candidates: TCandidate[], signal: AbortSignal): Promise<TCandidate[]> => {
  if (!candidates.length) return []

  const payload: TControlSuggestionCandidate[] = candidates.map(({ refCode, title, referenceFramework, description }) => ({
    refCode: toCandidateLabel(refCode),
    title: toCandidateLabel(title),
    framework: toCandidateLabel(referenceFramework),
    description: toCandidateDescription(description),
  }))

  const response = await fetch('/api/control-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ details: details.slice(0, MAX_SUGGESTION_DETAILS_LENGTH), candidates: payload }),
    signal,
  })
  if (!response.ok) throw new UserFacingError(await readError(response))

  const { matches } = controlSuggestionsResponseSchema.parse(await response.json())
  return matches.flatMap((index) => {
    const candidate = candidates[index]
    return candidate ? [candidate] : []
  })
}

const buildMappingsWhere = (matched: TSuggestedControl[]): MappedControlWhereInput => {
  const { controlIds, subcontrolIds } = partitionByParent(matched)
  return {
    or: [
      ...(controlIds.length ? [{ hasFromControlsWith: [{ idIn: controlIds }] }, { hasToControlsWith: [{ idIn: controlIds }] }] : []),
      ...(subcontrolIds.length ? [{ hasFromSubcontrolsWith: [{ idIn: subcontrolIds }] }, { hasToSubcontrolsWith: [{ idIn: subcontrolIds }] }] : []),
    ],
  }
}

const fetchMappings = (client: GraphQLClient, matched: TSuggestedControl[], signal: AbortSignal): Promise<TMappingNode[]> =>
  fetchAllConnectionNodes(async (after) => {
    const data = await client.request<GetControlSuggestionMappingsQuery, GetControlSuggestionMappingsQueryVariables>({
      document: GET_CONTROL_SUGGESTION_MAPPINGS,
      variables: {
        where: buildMappingsWhere(matched),
        controlWhere: CONTROL_ELIGIBILITY,
        subcontrolWhere: { ...SUBCONTROL_ELIGIBILITY, hasControlWith: [CONTROL_ELIGIBILITY] },
        first: MAX_CONNECTION_RESULTS,
        after,
      },
      signal,
    })
    return data.mappedControls
  })

const groupWithMappings = (matched: TSuggestedControl[], mappings: TMappingNode[]): TSuggestionGroup[] => {
  const sides = mappings.map((mapping) => ({
    mappingType: mapping.mappingType,
    from: [...getNodes(mapping.fromControls), ...getNodes(mapping.fromSubcontrols)].map(toSuggestedControl),
    to: [...getNodes(mapping.toControls), ...getNodes(mapping.toSubcontrols)].map(toSuggestedControl),
  }))

  return matched.map((control) => {
    const contains = (side: TSuggestedControl[]) => side.some(({ id }) => id === control.id)
    const mapped = new Map<string, TSuggestedMapping>()
    sides.forEach(({ mappingType, from, to }) => {
      const others = contains(from) ? to : contains(to) ? from : []
      others.filter(({ id }) => id !== control.id && !mapped.has(id)).forEach((other) => mapped.set(other.id, { ...other, mappingType }))
    })
    return { control, mapped: [...mapped.values()] }
  })
}

const stripDescription = ({ id, refCode, title, referenceFramework, parentControlId }: TCandidate): TSuggestedControl => ({ id, refCode, title, referenceFramework, parentControlId })

type TSuggestContext = {
  queryClient: QueryClient
  client: GraphQLClient
  organizationId?: string
  details: string
  canReadMappings: boolean
  signal: AbortSignal
}

const findMatches = async ({ queryClient, client, organizationId, details, signal }: TSuggestContext, source: TSuggestionSource) => {
  const pool = await getCandidatePool(queryClient, client, organizationId, source)
  const matches = await matchCandidates(details, pool.candidates, signal)
  return { isPartial: pool.isPartial, matches: matches.map(stripDescription) }
}

const suggestControls = async (context: TSuggestContext): Promise<TControlSuggestions> => {
  const organization = await findMatches(context, 'organization')
  if (organization.matches.length) {
    const mappings = context.canReadMappings ? await fetchMappings(context.client, organization.matches, context.signal) : []
    return { source: 'organization', groups: groupWithMappings(organization.matches, mappings), isPartial: organization.isPartial }
  }

  const framework = await findMatches(context, 'framework')
  return {
    source: 'framework',
    groups: groupWithMappings(framework.matches, []),
    isPartial: organization.isPartial || framework.isPartial,
  }
}

type TUseControlSuggestionsArgs = {
  controlImplementationId: string
  details: string
  enabled: boolean
}

export const useControlSuggestions = ({ controlImplementationId, details, enabled }: TUseControlSuggestionsArgs) => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrganization()
  const canReadMappings = useHasObjectType(ObjectTypes.MAPPED_CONTROL)

  useEffect(
    () =>
      queryClient.getQueryCache().subscribe((event) => {
        if (event.type !== 'updated' || event.action.type !== 'invalidate' || !SOURCE_QUERY_ROOTS.has(event.query.queryKey[0])) return
        queryClient.invalidateQueries({ queryKey: [CANDIDATES_KEY] }, { cancelRefetch: false })
        queryClient.invalidateQueries({ queryKey: [SUGGESTIONS_KEY], refetchType: 'none' })
      }),
    [queryClient],
  )

  return useQuery<TControlSuggestions>({
    queryKey: [SUGGESTIONS_KEY, currentOrgId, controlImplementationId, details],
    queryFn: ({ signal }) => suggestControls({ queryClient, client, organizationId: currentOrgId, details, canReadMappings, signal }),
    enabled: enabled && !!details,
    staleTime: SUGGESTIONS_STALE_TIME_MS,
    gcTime: SUGGESTIONS_STALE_TIME_MS,
    placeholderData: undefined,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export const pruneLinkedSuggestions = (groups: TSuggestionGroup[], linkedIds: ReadonlySet<string>) => {
  const visibleGroups = groups
    .map(({ control, mapped }) => ({ control, mapped: mapped.filter(({ id }) => !linkedIds.has(id)) }))
    .filter(({ control, mapped }) => !linkedIds.has(control.id) || mapped.length > 0)
  const unlinked = [...new Map(visibleGroups.flatMap(({ control, mapped }) => [control, ...mapped]).map((item) => [item.id, item])).values()].filter(({ id }) => !linkedIds.has(id))
  return { visibleGroups, unlinked }
}

export type TMappingSource = { controlId: string } | { subcontrolId: string }

type TRelatedControl = NonNullable<GetControlRelatedControlsQuery['control']['relatedControls']>[number] | NonNullable<GetSubcontrolRelatedControlsQuery['subcontrol']['relatedControls']>[number]

const isInherited = (control: TRelatedControl) => 'inheritedFromSubcontrolIDs' in control && !!control.inheritedFromSubcontrolIDs?.length

const isDirectlyMappedAndLinkable = (control: TRelatedControl) =>
  !isInherited(control) && !(control.status && INACTIVE_CONTROL_STATUSES.includes(control.status)) && control.referenceFramework !== OPENLANE_TRUST_CENTER_STANDARD.shortName

const toMappingSuggestions = (sourceId: string, related: TRelatedControl[]): TSuggestedControl[] => {
  const suggestions = related
    .filter((control) => control.id !== sourceId && isDirectlyMappedAndLinkable(control))
    .map(({ id, refCode, title, referenceFramework, parentControlID }) => ({ id, refCode, title, referenceFramework, parentControlId: parentControlID ?? undefined }))
  const unique = [...new Map(suggestions.map((suggestion) => [suggestion.id, suggestion])).values()]
  return unique.sort((a, b) => compareNatural(a.referenceFramework ?? '', b.referenceFramework ?? '') || compareNatural(a.refCode, b.refCode))
}

export const useMappedControlSuggestions = (source: TMappingSource) => {
  const controlId = 'controlId' in source ? source.controlId : undefined
  const subcontrolId = 'subcontrolId' in source ? source.subcontrolId : undefined
  const sourceId = 'controlId' in source ? source.controlId : source.subcontrolId
  const controlQuery = useGetControlRelatedControls(controlId, !!controlId)
  const subcontrolQuery = useGetSubcontrolRelatedControls(subcontrolId, !!subcontrolId)
  const query = controlId ? controlQuery : subcontrolQuery
  const related = controlId ? controlQuery.data?.control.relatedControls : subcontrolQuery.data?.subcontrol.relatedControls

  const suggestions = useMemo(() => toMappingSuggestions(sourceId, related ?? []), [sourceId, related])

  return { suggestions, isPending: query.isPending || query.isPlaceholderData, error: query.error }
}
