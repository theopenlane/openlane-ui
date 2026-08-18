'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDismissible } from '@/hooks/useDismissible'
import { DismissButton, DocsSourceLink, SuggestionRow } from '@/components/shared/docs-help/suggestion-card'
import { parseDocBullets } from '@/lib/docs-help/parse'
import { Lightbulb, Link2, Sparkles } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { docsHelpEnabled } from '@repo/dally/ai'
import { useAllPolicyNames, useInternalPolicies, useUpdateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { usePolicyTemplates } from '@/components/pages/protected/policies/suggested-policy-coverage'
import { CreatePolicyMenuItems, findPolicyTemplate, useCreatePolicyFromTemplate } from '@/components/pages/protected/policies/create-policy-actions'

import { coverageNote, namesMatch, policyCovers } from '@/lib/docs-help/names'
import { useDismissedItems } from '@/hooks/useDismissedItems'
import { useControlDocsSection, type TDocsEvidenceControl } from '@/components/pages/protected/controls/example-evidence-requests'

type TSuggestedPolicy = {
  name: string
  description: string
  existingPolicy?: { id: string; name: string }
}

export type TSuggestedPoliciesData = {
  controlId: string
  target: { refCode: string; framework: string }
  suggestions: TSuggestedPolicy[]
  dismissed: boolean
  dismiss: () => void
  dismissOne: (policyName: string) => void
}

const parsePolicies = (section: string): Array<{ name: string; description: string }> => parseDocBullets(section).map((bullet) => ({ name: bullet.label, description: bullet.description }))

type TOrgPolicy = { id: string; name: string; summary?: string | null }

// Names first, then the looser content match, and each policy is claimed by at
// most one suggestion — otherwise a broad policy answers several topics at once
// and the mapping dialog offers to map it repeatedly
function matchExistingPolicies(rows: Array<{ name: string; description: string }>, orgPolicies: TOrgPolicy[]): TSuggestedPolicy[] {
  const claimed = new Set<string>()
  const matched: TSuggestedPolicy[] = rows.map((row) => ({ ...row }))

  const claim = (matches: (policy: TOrgPolicy, row: TSuggestedPolicy) => boolean) => {
    for (const row of matched) {
      if (row.existingPolicy) continue
      const hit = orgPolicies.find((policy) => !claimed.has(policy.id) && matches(policy, row))
      if (!hit) continue
      claimed.add(hit.id)
      row.existingPolicy = { id: hit.id, name: hit.name }
    }
  }

  claim((policy, row) => namesMatch(policy.name, row.name))
  claim((policy, row) => policyCovers(policy, row))
  return matched
}

export function useSuggestedPolicies(control?: TDocsEvidenceControl): TSuggestedPoliciesData | null {
  const { dismissed, dismiss, isResolved } = useDismissible(`suggested-policies-dismissed:${control?.controlId ?? ''}`)
  const { isDismissed, dismiss: dismissOne } = useDismissedItems(control?.controlId ? `suggested-policy-covered:${control.controlId}` : undefined)

  // a dismissed control asks nothing of the docs or of the policy list
  const active = docsHelpEnabled && isResolved && !dismissed
  const { section, target } = useControlDocsSection(active ? control : undefined, 'Policies')
  const enabled = active && !!section && !!control?.controlId

  const { policies: orgPolicies, isLoading: isPoliciesLoading } = useAllPolicyNames({ enabled })
  const { data: linkedPoliciesData, isLoading: isLinkedLoading } = useInternalPolicies({ where: { hasControlsWith: [{ id: control?.controlId ?? '' }] }, enabled })

  const settled = enabled && !isPoliciesLoading && !isLinkedLoading && !!section

  const suggestions = useMemo(() => {
    if (!settled || !section) return null
    const linkedPolicyIds = new Set((linkedPoliciesData?.internalPolicies?.edges ?? []).flatMap((e) => (e?.node?.id ? [e.node.id] : [])))
    return matchExistingPolicies(
      parsePolicies(section).filter((row) => !isDismissed(row.name)),
      orgPolicies,
    ).filter((row) => !row.existingPolicy || !linkedPolicyIds.has(row.existingPolicy.id))
  }, [settled, section, linkedPoliciesData, orgPolicies, isDismissed])

  // every suggested policy is already linked, so there is nothing left to ask about this control on any future visit
  useEffect(() => {
    if (suggestions && suggestions.length === 0 && !dismissed) dismiss()
  }, [suggestions, dismissed, dismiss])

  if (!docsHelpEnabled || !control || !target || !suggestions) return null

  return { controlId: control.controlId, target, suggestions, dismissed, dismiss, dismissOne }
}

export function SuggestedPolicies({ data }: { data: TSuggestedPoliciesData | null }) {
  const { successNotification, errorNotification } = useNotification()
  const { data: templates } = usePolicyTemplates(!!data && !data.dismissed)
  const { mutateAsync: updatePolicy } = useUpdateInternalPolicy()
  const { createFromTemplate } = useCreatePolicyFromTemplate(data?.controlId)
  const [busyPolicy, setBusyPolicy] = useState<string | null>(null)

  if (!data || data.dismissed || data.suggestions.length === 0) return null
  const { controlId, target, suggestions, dismiss, dismissOne } = data

  const mapExistingPolicy = async (policy: { id: string; name: string }) => {
    setBusyPolicy(policy.id)
    try {
      await updatePolicy({ updateInternalPolicyId: policy.id, input: { addControlIDs: [controlId] } })
      successNotification({ title: 'Policy mapped', description: `${policy.name} is now linked to this control` })
    } catch (error) {
      errorNotification({ title: 'Failed to map policy', description: parseErrorMessage(error) })
    } finally {
      setBusyPolicy(null)
    }
  }

  return (
    <Card className="p-4">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className="text-[var(--color-warning)]" />
          <h3 className="text-base font-semibold">Suggested policies</h3>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <DocsSourceLink
            label={`From ${target.framework} ${target.refCode} docs`}
            topic={{ title: `${target.framework} ${target.refCode}`, query: `${target.framework} ${target.refCode}`, prefer: target.refCode }}
          />
          <DismissButton onClick={dismiss} label="Dismiss suggested policies" />
        </div>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        We recommend these polices for {target.framework} - {target.refCode}:
      </p>
      <div className="flex flex-col gap-2">
        {suggestions.map((row) => {
          const existingPolicy = row.existingPolicy
          const template = existingPolicy ? undefined : findPolicyTemplate(templates, row.name)
          return (
            <SuggestionRow
              key={row.name}
              title={existingPolicy?.name ?? row.name}
              note={existingPolicy && coverageNote(existingPolicy.name, row.name)}
              description={row.description}
              action={
                <div className="flex shrink-0 items-center gap-3">
                  {existingPolicy ? (
                    <button
                      type="button"
                      disabled={busyPolicy === existingPolicy.id}
                      onClick={() => mapExistingPolicy(existingPolicy)}
                      className="inline-flex shrink-0 items-center gap-1.5 text-sm text-[var(--color-info)] hover:underline underline-offset-4 disabled:opacity-50"
                    >
                      <Link2 size={14} />
                      Map existing policy
                    </button>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className="inline-flex shrink-0 items-center gap-1.5 text-sm text-[var(--color-info)] hover:underline underline-offset-4">
                          <Sparkles size={14} />
                          Create &amp; map
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <CreatePolicyMenuItems policyName={row.name} template={template} mapControlId={controlId} onCreateFromTemplate={createFromTemplate} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <DismissButton onClick={() => dismissOne(row.name)} label={`Dismiss ${row.name}`} tooltip="Already covered by another policy" />
                </div>
              }
            />
          )
        })}
      </div>
    </Card>
  )
}
