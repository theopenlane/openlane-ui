'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Lightbulb, Link2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { DismissButton, SuggestionCard, SuggestionRow } from '@/components/shared/docs-help/suggestion-card'
import { useDismissible } from '@/hooks/useDismissible'
import { docsHelpEnabled } from '@repo/dally/ai'
import { useGetAllControls } from '@/lib/graphql-hooks/control'
import { useUpdateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { usePolicyTemplates } from '@/components/pages/protected/policies/suggested-policy-coverage'
import { findPolicyTemplate } from '@/components/pages/protected/policies/create-policy-actions'

type TSuggestedControl = {
  id: string
  refCode: string
  referenceFramework?: string | null
  // why this control is suggested
  reason: 'template' | 'mentioned'
}

// policy-hub templates declare the controls they satisfy in frontmatter:
//   satisfies:
//     SOC 2:
//       - CC5.2
//       - CC6.1
function parseSatisfiesFrontmatter(markdown: string): string[] {
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---/)?.[1]
  if (!frontmatter) return []
  const satisfiesBlock = frontmatter.match(/^satisfies:\s*\n((?:[ \t]+.*\n?)*)/m)?.[1]
  if (!satisfiesBlock) return []
  const refCodes: string[] = []
  for (const line of satisfiesBlock.split('\n')) {
    const item = line.match(/^\s+-\s+(.+?)\s*$/)
    if (item) refCodes.push(item[1].replace(/^["']|["']$/g, ''))
  }
  return refCodes
}

// ref codes as written in policy text: CC6.1, A1.1, PI1.2, 8.2.1, AC-2
const REF_CODE_PATTERN = /\b([A-Z]{1,4}[-.]?\d{1,2}(?:\.\d{1,2}){0,2}|\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)\b/g

function extractMentionedRefCodes(html?: string | null): string[] {
  if (!html) return []
  const text = html.replace(/<[^>]*>/g, ' ')
  return [...new Set([...text.matchAll(REF_CODE_PATTERN)].map((m) => m[1]))]
}

const normalizeRef = (value: string) => value.replace(/[^a-z0-9]/gi, '').toLowerCase()

// Suggests controls this policy should be mapped to, from two sources: the
// matching Policy Hub template's `satisfies` frontmatter, and control ref
// codes written in the policy text. Already-linked controls are excluded
export function SuggestedControlMappings({
  policyId,
  policyName,
  policyDetailsHtml,
  linkedControlIds,
  linkedControlsLoading,
}: {
  policyId: string
  policyName?: string | null
  policyDetailsHtml?: string | null
  linkedControlIds: string[]
  // suggesting before the existing links are known produces false positives
  linkedControlsLoading?: boolean
}) {
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updatePolicy } = useUpdateInternalPolicy()
  const [busyId, setBusyId] = useState<string | null>(null)

  const { dismissed, dismiss } = useDismissible(`suggested-control-mappings-dismissed:${policyId}`)

  // the matching Policy Hub template, if any, for its satisfies frontmatter
  const { data: templates } = usePolicyTemplates(docsHelpEnabled && !dismissed)
  const template = policyName ? findPolicyTemplate(templates, policyName) : undefined

  const templateUrl = template?.downloadUrl
  const { data: templateRefCodes } = useQuery({
    queryKey: ['policy-hub-template-satisfies', templateUrl],
    queryFn: async () => {
      if (!templateUrl) return []
      const response = await fetch(templateUrl)
      return parseSatisfiesFrontmatter(await response.text())
    },
    enabled: !!templateUrl && !dismissed,
    staleTime: 60 * 60 * 1000,
    retry: false,
  })

  // the backend maps controls itself when a policy is created, so the ref codes
  // already in the policy when we first see it are its responsibility —
  // suggesting them too would race it and error. Only codes the user adds
  // afterwards are ours to offer
  const [baselineRefCodes, setBaselineRefCodes] = useState<Set<string> | null>(null)
  const mentionedRefCodes = extractMentionedRefCodes(policyDetailsHtml)
  useEffect(() => {
    if (baselineRefCodes === null && policyDetailsHtml != null) {
      setBaselineRefCodes(new Set(extractMentionedRefCodes(policyDetailsHtml).map(normalizeRef)))
    }
  }, [policyDetailsHtml, baselineRefCodes])

  const addedRefCodes = baselineRefCodes === null ? [] : mentionedRefCodes.filter((code) => !baselineRefCodes.has(normalizeRef(code)))
  const wantedRefCodes = [...new Set([...(templateRefCodes ?? []), ...addedRefCodes])]

  // resolve ref codes to controls this org owns; the framework catalog has
  // controls with the same ref codes, but a policy can't be mapped to those
  const { data: controlsData } = useGetAllControls({
    where: { refCodeIn: wantedRefCodes, systemOwned: false, isTrustCenterControl: false },
    enabled: docsHelpEnabled && !dismissed && wantedRefCodes.length > 0,
  })

  if (!docsHelpEnabled || dismissed || linkedControlsLoading) return null

  const linked = new Set(linkedControlIds)
  const templateSet = new Set((templateRefCodes ?? []).map(normalizeRef))

  const suggestions: TSuggestedControl[] = (controlsData?.controls?.edges ?? []).flatMap((edge) => {
    const node = edge?.node
    if (!node?.id || !node.refCode || linked.has(node.id)) return []
    return [
      {
        id: node.id,
        refCode: node.refCode,
        referenceFramework: node.referenceFramework,
        reason: templateSet.has(normalizeRef(node.refCode)) ? ('template' as const) : ('mentioned' as const),
      },
    ]
  })

  if (suggestions.length === 0) return null

  const mapControls = async (ids: string[]) => {
    setBusyId(ids.length === 1 ? ids[0] : 'all')
    try {
      await updatePolicy({ updateInternalPolicyId: policyId, input: { addControlIDs: ids } })
      successNotification({ title: `Mapped ${ids.length} control${ids.length === 1 ? '' : 's'}`, description: 'The policy is now linked to them' })
    } catch (error) {
      errorNotification({ title: 'Failed to map controls', description: parseErrorMessage(error) })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <SuggestionCard
      className="mb-4"
      title="Suggested control mappings"
      icon={<Lightbulb size={16} className="shrink-0 text-[var(--color-warning)]" />}
      count={suggestions.length}
      defaultOpen={false}
      intro="These controls look related to this policy but aren't linked yet."
      actions={
        <>
          {suggestions.length > 1 && (
            <Button variant="secondary" className="h-7 px-2 text-xs" disabled={busyId !== null} onClick={() => mapControls(suggestions.map((s) => s.id))}>
              Map all
            </Button>
          )}
          <DismissButton onClick={dismiss} label="Dismiss suggested control mappings" />
        </>
      }
    >
      <div className="flex flex-col gap-2">
        {suggestions.map((suggestion) => (
          <SuggestionRow
            key={suggestion.id}
            title={`${suggestion.referenceFramework ? `${suggestion.referenceFramework} ` : ''}${suggestion.refCode}`}
            note={suggestion.reason === 'template' ? 'from the policy template' : 'mentioned in this policy'}
            action={
              <button
                type="button"
                disabled={busyId !== null}
                onClick={() => mapControls([suggestion.id])}
                className="inline-flex shrink-0 items-center gap-1.5 text-sm text-[var(--color-info)] hover:underline underline-offset-4 disabled:opacity-50"
              >
                <Link2 size={14} />
                Map
              </button>
            }
          />
        ))}
      </div>
    </SuggestionCard>
  )
}
