'use client'

import { policyCovers } from '@/lib/docs-help/names'
import { wordTokens } from '@/utils/strings'

export { namesMatch, normalizeName } from '@/lib/docs-help/names'

const frameworkMatches = (docsFramework: string, orgFramework: string) => {
  const a = wordTokens(docsFramework)
  const b = wordTokens(orgFramework)
  if (!a.length || !b.length) return false
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a]
  return shorter.every((t) => longer.includes(t))
}

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BookText, Lightbulb, X } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { docsHelpEnabled } from '@repo/dally/ai'
import { useGetProgramDashboard } from '@/lib/graphql-hooks/program'
import { useAllPolicyNames } from '@/lib/graphql-hooks/internal-policy'
import { useDocsHelpNavigate } from '@/components/shared/docs-help/docs-help-context'
import { useDismissible } from '@/hooks/useDismissible'
import { DismissButton } from '@/components/shared/docs-help/suggestion-card'
import { CreatePolicyMenuItems, findPolicyTemplate, useCreatePolicyFromTemplate, type PolicyTemplate } from '@/components/pages/protected/policies/create-policy-actions'
import { useDismissedItems } from '@/hooks/useDismissedItems'

import { GITHUB_API_BASE, POLICY_DIRECTORIES, POLICY_REPO } from '@/constants/templates'
import type { DocsPolicyMappingRow } from '@/lib/docs-help/types'

// tokens for loose name comparison: "ISO/IEC 27001" matches "ISO 27001"

function useDocsPolicyMapping(enabled: boolean) {
  return useQuery({
    queryKey: ['docs-help-policy-mapping'],
    queryFn: async () => {
      const res = await fetch('/api/docs-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'policies to framework mapping', prefer: 'policy-framework-mapping', policyMapping: true }),
      })
      if (!res.ok) throw new Error(`docs-help ${res.status}`)
      const data = await res.json()
      return { mapping: (data.mapping ?? []) as DocsPolicyMappingRow[], source: (data.source ?? '') as string }
    },
    enabled,
    staleTime: 60 * 60 * 1000, // the docs mapping barely changes
    retry: false,
    placeholderData: undefined,
  })
}

// template files from the Policy Hub repo, for offering (and directly
// creating from) a matching template for a suggested policy
export type { PolicyTemplate }

export function usePolicyTemplates(enabled: boolean) {
  return useQuery({
    queryKey: ['policy-hub-templates'],
    queryFn: async () => {
      const templates: PolicyTemplate[] = []
      await Promise.all(
        POLICY_DIRECTORIES.map(async (dir) => {
          const response = await fetch(`${GITHUB_API_BASE}/${POLICY_REPO}/contents/${dir.path}?ref=main`)
          if (!response.ok) return
          const data: Array<{ type?: string; name?: string; download_url?: string; size?: number }> = await response.json()
          for (const item of data) {
            if (item?.type === 'file' && item.name && item.download_url) templates.push({ name: item.name, downloadUrl: item.download_url, size: item.size })
          }
        }),
      )
      return templates
    },
    enabled,
    staleTime: 60 * 60 * 1000,
    retry: false,
  })
}

// Compares the docs' suggested policies for the org's frameworks (from its
// programs) against the policies that exist, and calls out the missing ones.
// Each missing policy can be created with AI or from a Policy Hub template
export function SuggestedPolicyCoverage() {
  const navigateDocs = useDocsHelpNavigate()
  // per-org dismissal, persisted so the alert stays gone once waved away
  const { dismissed, dismiss: handleDismiss, isResolved } = useDismissible('policy-coverage-dismissed')
  const { isDismissed, dismiss: dismissTopic } = useDismissedItems('policy-coverage-covered')
  const { data: mappingData, isPending: isMappingPending } = useDocsPolicyMapping(docsHelpEnabled)
  const { data: programsData, isPending: isProgramsPending } = useGetProgramDashboard({ enabled: docsHelpEnabled })
  // held back until the page's own data is in, then paged through in the background
  const { policies: orgPolicies, isLoading: isPoliciesLoading } = useAllPolicyNames({ enabled: docsHelpEnabled && isResolved && !dismissed && !!mappingData && !!programsData })
  const { data: templates } = usePolicyTemplates(docsHelpEnabled)

  const { createFromTemplate, creatingTemplate } = useCreatePolicyFromTemplate()
  const [showAll, setShowAll] = useState(false)

  const coverage = useMemo(() => {
    // until every query is in, everything reads as missing and the card would
    // flash a full list before emptying itself
    if (isMappingPending || isProgramsPending || isPoliciesLoading) return null
    const mapping = mappingData?.mapping ?? []

    const orgFrameworks = [...new Set((programsData?.programs?.edges ?? []).map((e) => e?.node?.frameworkName).filter((f): f is string => !!f))]
    const suggested = mapping.filter((row) => row.frameworks[0] === 'all' || row.frameworks.some((f) => orgFrameworks.some((org) => frameworkMatches(f, org))))
    const missing = suggested.filter((row) => !isDismissed(row.policy) && !orgPolicies.some((policy) => policyCovers(policy, { name: row.policy })))

    return { orgFrameworks, total: suggested.length, missing }
  }, [mappingData, programsData, isMappingPending, isProgramsPending, orgPolicies, isPoliciesLoading, isDismissed])

  // nothing missing means nothing to check again, so retire the card rather than
  // paging every policy in the org on each visit
  useEffect(() => {
    if (coverage && coverage.total > 0 && coverage.missing.length === 0) handleDismiss()
  }, [coverage, handleDismiss])

  if (!docsHelpEnabled || dismissed || !coverage || coverage.missing.length === 0) return null

  const covered = coverage.total - coverage.missing.length
  const COLLAPSED_COUNT = 6
  const visibleMissing = showAll ? coverage.missing : coverage.missing.slice(0, COLLAPSED_COUNT)
  const hiddenCount = coverage.missing.length - visibleMissing.length

  return (
    <>
      <Card className="mt-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-warning)]/15">
              <Lightbulb size={18} className="text-[var(--color-warning)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Suggested policy coverage</h3>
              <p className="text-sm text-muted-foreground">
                Based on your {coverage.orgFrameworks.length > 0 ? <>frameworks ({coverage.orgFrameworks.join(', ')})</> : 'compliance program'}, we recommend coverage for the following policy topics.
                You don’t need a separate policy for each topic. Policies can be combined as long as the required areas are covered.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {covered} of {coverage.total}
            </span>
            <DismissButton onClick={handleDismiss} label="Dismiss suggested policy coverage" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {visibleMissing.map((row) => {
            const template = findPolicyTemplate(templates, row.policy)
            return (
              <DropdownMenu key={row.policy}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary data-[state=open]:border-primary data-[state=open]:text-primary"
                  >
                    {row.policy}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <CreatePolicyMenuItems policyName={row.policy} template={template} onCreateFromTemplate={createFromTemplate} />
                  <DropdownMenuItem className="flex items-center gap-2" onSelect={() => dismissTopic(row.policy)}>
                    <X size={14} />
                    Already covered
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-4">
            {hiddenCount > 0 && <span className="text-sm text-muted-foreground">+{hiddenCount} more suggested policies</span>}
            <button
              type="button"
              onClick={() =>
                navigateDocs({
                  title: 'Policies to Framework Mapping',
                  query: 'policies to framework mapping',
                  prefer: 'policy-framework-mapping',
                })
              }
              className="inline-flex items-center gap-1.5 text-sm text-[var(--color-info)] hover:underline underline-offset-4"
            >
              About this mapping
              <BookText size={12} />
            </button>
          </div>
          {coverage.missing.length > COLLAPSED_COUNT && (
            <button type="button" onClick={() => setShowAll(!showAll)} className="inline-flex items-center gap-1.5 text-sm text-[var(--color-info)] hover:underline underline-offset-4">
              {showAll ? 'Show less' : 'View all'}
              <ArrowRight size={14} className={showAll ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
          )}
        </div>
      </Card>

      {creatingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <p className="text-lg">Creating policy from template…</p>
        </div>
      )}
    </>
  )
}
