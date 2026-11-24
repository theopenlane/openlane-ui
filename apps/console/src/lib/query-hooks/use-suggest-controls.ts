import { useMutation } from '@tanstack/react-query'
import { GET_ALL_CONTROLS } from '@repo/codegen/query/control'
import { ControlControlStatus, ControlOrderField, OrderDirection, type GetAllControlsQuery, type GetAllControlsQueryVariables } from '@repo/codegen/src/schema'
import { MAX_CONNECTION_RESULTS } from '@/constants/pagination'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { controlSuggestionsResponseSchema, MAX_SUGGESTION_CANDIDATES, MAX_SUGGESTION_DETAILS_LENGTH, toCandidateLabel } from '@/lib/control-suggestions/schema'
import { fetchAllConnectionNodes } from '@/lib/graphql-hooks/fetch-all-connection-nodes'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'

type TControlNode = NonNullable<NonNullable<NonNullable<GetAllControlsQuery['controls']['edges']>[number]>['node']>

export type TSuggestedControl = {
  id: string
  refCode: string
  title?: string | null
  referenceFramework?: string | null
}

type TControlSuggestions = {
  controls: TSuggestedControl[]
  isPartial: boolean
}

const CANDIDATES_WHERE: GetAllControlsQueryVariables['where'] = {
  systemOwned: false,
  isTrustCenterControl: false,
  or: [{ statusIsNil: true }, { statusNotIn: [ControlControlStatus.ARCHIVED, ControlControlStatus.NOT_APPLICABLE] }],
}

const readError = async (response: Response): Promise<string> => {
  const body: { error?: string } | null = await response.json().catch(() => null)
  return body?.error ?? 'Failed to suggest controls'
}

export const useSuggestControls = () => {
  const { client } = useGraphQLClient()

  return useMutation<TControlSuggestions, Error, string>({
    mutationFn: async (details) => {
      let totalCount = 0
      const controls = await fetchAllConnectionNodes<TControlNode>(async (after) => {
        const data = await client.request<GetAllControlsQuery, GetAllControlsQueryVariables>(GET_ALL_CONTROLS, {
          where: CANDIDATES_WHERE,
          orderBy: [{ field: ControlOrderField.ref_code, direction: OrderDirection.ASC }],
          first: MAX_CONNECTION_RESULTS,
          after,
          includeTitle: true,
        })
        totalCount = data.controls.totalCount
        return data.controls
      }, MAX_SUGGESTION_CANDIDATES)
      const isPartial = totalCount > controls.length
      if (controls.length === 0) return { controls: [], isPartial }

      const response = await fetch('/api/control-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          details: details.slice(0, MAX_SUGGESTION_DETAILS_LENGTH),
          candidates: controls.map(({ refCode, title, referenceFramework }) => ({
            refCode: toCandidateLabel(refCode),
            title: toCandidateLabel(title),
            framework: toCandidateLabel(referenceFramework),
          })),
        }),
      })
      if (!response.ok) throw new UserFacingError(await readError(response))

      const { matches } = controlSuggestionsResponseSchema.parse(await response.json())
      const suggested = matches.flatMap((index) => {
        const control = controls[index]
        return control ? [{ id: control.id, refCode: control.refCode, title: control.title, referenceFramework: control.referenceFramework }] : []
      })
      return { controls: suggested, isPartial }
    },
  })
}
