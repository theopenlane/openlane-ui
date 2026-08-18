'use client'

import { useState } from 'react'
import { useDismissible } from '@/hooks/useDismissible'
import { DismissButton, DocsSourceLink, SuggestionRow } from '@/components/shared/docs-help/suggestion-card'
import { parseDocBullets } from '@/lib/docs-help/parse'
import { useRouter } from 'next/navigation'
import { FileTextIcon, Lightbulb, Link2, Sparkles } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { docsHelpEnabled } from '@repo/dally/ai'
import { useCreateUploadInternalPolicy, useInternalPolicies, useUpdateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { namesMatch, tokens, usePolicyTemplates, type PolicyTemplate } from '@/components/pages/protected/policies/suggested-policy-coverage'
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
}

const parsePolicies = (section: string): Array<{ name: string; description: string }> => parseDocBullets(section).map((bullet) => ({ name: bullet.label, description: bullet.description }))

const allPoliciesPagination = { page: 1, pageSize: 200, query: { first: 200 } }

export function useSuggestedPolicies(control?: TDocsEvidenceControl): TSuggestedPoliciesData | null {
  const { section, target } = useControlDocsSection(docsHelpEnabled ? control : undefined, 'Policies')
  const enabled = docsHelpEnabled && !!section && !!control?.controlId

  const { data: policiesData } = useInternalPolicies({ where: {}, enabled, pagination: allPoliciesPagination })

  const { data: linkedPoliciesData } = useInternalPolicies({ where: { hasControlsWith: [{ id: control?.controlId ?? '' }] }, enabled })

  const { dismissed, dismiss } = useDismissible(`suggested-policies-dismissed:${control?.controlId ?? ''}`)

  if (!docsHelpEnabled || !control || !section || !target) return null

  const orgPolicies = (policiesData?.internalPolicies?.edges ?? []).flatMap((e) => (e?.node?.id && e.node.name ? [{ id: e.node.id, name: e.node.name }] : []))
  const linkedPolicyIds = new Set((linkedPoliciesData?.internalPolicies?.edges ?? []).flatMap((e) => (e?.node?.id ? [e.node.id] : [])))

  const suggestions: TSuggestedPolicy[] = parsePolicies(section)
    .map((row) => {
      const existingPolicy = orgPolicies.find((p) => namesMatch(p.name, row.name))
      return { ...row, existingPolicy }
    })
    .filter((row) => !row.existingPolicy || !linkedPolicyIds.has(row.existingPolicy.id))

  return { controlId: control.controlId, target, suggestions, dismissed, dismiss }
}

export function SuggestedPolicies({ data }: { data: TSuggestedPoliciesData | null }) {
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const { data: templates } = usePolicyTemplates(!!data && !data.dismissed)
  const { mutateAsync: updatePolicy } = useUpdateInternalPolicy()
  const { mutateAsync: createUploadPolicy } = useCreateUploadInternalPolicy()
  const [busyPolicy, setBusyPolicy] = useState<string | null>(null)

  if (!data || data.dismissed || data.suggestions.length === 0) return null
  const { controlId, target, suggestions, dismiss } = data

  const findTemplate = (policy: string): PolicyTemplate | undefined => (templates ?? []).find((t) => tokens(policy).every((token) => t.name.toLowerCase().includes(token)))

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

  const createFromTemplate = async (template: PolicyTemplate) => {
    setBusyPolicy(template.name)
    try {
      const response = await fetch(template.downloadUrl)
      if (!response.ok) throw new Error(`Could not download the ${template.name} template (${response.status})`)
      const blob = await response.blob()
      const file = new File([blob], template.name, { type: blob.type || 'text/markdown' })
      const result = await createUploadPolicy({ internalPolicyFile: file })
      const policyId = result.createUploadInternalPolicy.internalPolicy.id

      await updatePolicy({ updateInternalPolicyId: policyId, input: { addControlIDs: [controlId] } })
      successNotification({ title: 'Policy created and mapped', description: `Created from the ${template.name} template` })
      router.push(`/policies/${policyId}/view`)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
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
          const template = existingPolicy ? undefined : findTemplate(row.name)
          return (
            <SuggestionRow
              key={row.name}
              title={row.name}
              description={row.description}
              action={
                existingPolicy ? (
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
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onSelect={() => router.push(`/policies/create?name=${encodeURIComponent(row.name)}&generate=true&mapControlId=${controlId}`)}
                      >
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
              }
            />
          )
        })}
      </div>
    </Card>
  )
}
