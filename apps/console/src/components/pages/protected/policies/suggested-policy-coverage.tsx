'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ArrowRight, BookText, FileTextIcon, Lightbulb, Sparkles, X } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { docsHelpEnabled } from '@repo/dally/ai'
import { useGetProgramDashboard } from '@/lib/graphql-hooks/program'
import { useCreateUploadInternalPolicy, useInternalPolicies } from '@/lib/graphql-hooks/internal-policy'
import { useDocsHelpNavigate } from '@/components/shared/docs-help/docs-help-context'
import { useNotification } from '@/hooks/useNotification'
import { useDismissible } from '@/hooks/useDismissible'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { GITHUB_API_BASE, POLICY_DIRECTORIES, POLICY_REPO } from '@/constants/templates'
import type { DocsPolicyMappingRow } from '@/lib/docs-help/types'

// tokens for loose name comparison: "ISO/IEC 27001" matches "ISO 27001"
export const tokens = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

// words that classify a document rather than identify it, so they shouldn't
// carry weight when deciding whether two policy names mean the same thing
const GENERIC_POLICY_WORDS = new Set(['policy', 'policies', 'standard', 'standards', 'procedure', 'procedures', 'plan', 'plans', 'program', 'management', 'and', 'of', 'the', 'for'])

const NAME_MATCH_THRESHOLD = 0.6

// Docs and orgs name the same document differently ("Business Continuity Plan"
// vs "Business Continuity and Disaster Recovery (BC/DR)"), so compare the
// identifying words rather than requiring one name to contain the other
export const namesMatch = (a: string, b: string) => {
  const na = normalizeName(a)
  const nb = normalizeName(b)
  if (na.includes(nb) || nb.includes(na)) return true

  const setA = new Set(tokens(a).filter((token) => !GENERIC_POLICY_WORDS.has(token)))
  const setB = new Set(tokens(b).filter((token) => !GENERIC_POLICY_WORDS.has(token)))
  if (setA.size === 0 || setB.size === 0) return false

  let shared = 0
  for (const token of setA) if (setB.has(token)) shared += 1
  // overlap coefficient, so a broader name still matches the narrower one it covers
  return shared / Math.min(setA.size, setB.size) >= NAME_MATCH_THRESHOLD
}

const frameworkMatches = (docsFramework: string, orgFramework: string) => {
  const a = tokens(docsFramework)
  const b = tokens(orgFramework)
  if (!a.length || !b.length) return false
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a]
  return shorter.every((t) => longer.includes(t))
}

export const normalizeName = (value: string) => tokens(value).join(' ')

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

export type PolicyTemplate = { name: string; downloadUrl: string; size?: number }

// template files from the Policy Hub repo, for offering (and directly
// creating from) a matching template for a suggested policy
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
  const router = useRouter()
  const navigateDocs = useDocsHelpNavigate()
  const { successNotification, errorNotification } = useNotification()
  const { data: mappingData } = useDocsPolicyMapping(docsHelpEnabled)
  const { data: programsData } = useGetProgramDashboard({ enabled: docsHelpEnabled })
  // every policy, not just the first page — an unseen policy reads as missing
  const { data: policiesData } = useInternalPolicies({ where: {}, enabled: docsHelpEnabled, pagination: { page: 1, pageSize: 200, query: { first: 200 } } })
  const { mutateAsync: createUploadPolicy } = useCreateUploadInternalPolicy()
  const { data: templates } = usePolicyTemplates(docsHelpEnabled)

  // same matching the template browser's search uses: every word appears
  const findTemplate = (policy: string) => (templates ?? []).find((t) => tokens(policy).every((token) => t.name.toLowerCase().includes(token)))

  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false)
  const [showAll, setShowAll] = useState(false)

  // per-org dismissal, persisted so the alert stays gone once waved away
  const { dismissed, dismiss: handleDismiss } = useDismissible('policy-coverage-dismissed')

  const coverage = useMemo(() => {
    const mapping = mappingData?.mapping ?? []
    if (!mapping.length) return null

    const orgFrameworks = [...new Set((programsData?.programs?.edges ?? []).map((e) => e?.node?.frameworkName).filter((f): f is string => !!f))]
    const policyNames = (policiesData?.internalPolicies?.edges ?? []).map((e) => e?.node?.name).filter((n): n is string => !!n)

    const suggested = mapping.filter((row) => row.frameworks[0] === 'all' || row.frameworks.some((f) => orgFrameworks.some((org) => frameworkMatches(f, org))))
    const missing = suggested.filter((row) => !policyNames.some((existing) => namesMatch(existing, row.policy)))

    return { orgFrameworks, total: suggested.length, missing }
  }, [mappingData, programsData, policiesData])

  // one click: download the matching template and create the policy from it
  const createFromTemplate = async (template: PolicyTemplate) => {
    setIsCreatingFromTemplate(true)
    try {
      const response = await fetch(template.downloadUrl)
      if (!response.ok) throw new Error(`Could not download the ${template.name} template (${response.status})`)

      const blob = await response.blob()
      const file = new File([blob], template.name, { type: blob.type || 'text/markdown' })
      const result = await createUploadPolicy({ internalPolicyFile: file })
      successNotification({ title: 'Policy Created', description: `Created from the ${template.name} template` })
      router.push(`/policies/${result.createUploadInternalPolicy.internalPolicy.id}/view`)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      setIsCreatingFromTemplate(false)
    }
  }

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
                Based on your {coverage.orgFrameworks.length > 0 ? <>frameworks ({coverage.orgFrameworks.join(', ')})</> : 'compliance program'}, we recommend the following policies.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {covered} of {coverage.total}
            </span>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss suggested policy coverage"
              className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {visibleMissing.map((row) => {
            const template = findTemplate(row.policy)
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
                  <DropdownMenuItem className="flex items-center gap-2" onSelect={() => router.push(`/policies/create?name=${encodeURIComponent(row.policy)}&generate=true`)}>
                    <Sparkles size={14} />
                    Create with AI
                  </DropdownMenuItem>
                  {template && (
                    <DropdownMenuItem className="flex items-center gap-2" onSelect={() => createFromTemplate(template)}>
                      <FileTextIcon size={14} />
                      From Policy Hub
                    </DropdownMenuItem>
                  )}
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

      {isCreatingFromTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <p className="text-lg">Creating policy from template…</p>
        </div>
      )}
    </>
  )
}
