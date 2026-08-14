'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { docsHelpEnabled } from '@repo/dally/ai'
import { ControlControlSource } from '@repo/codegen/src/schema'
import { useDocsSection } from '@/hooks/useDocsHelp'
import { useGetAllMappedControlsGrouped } from '@/lib/graphql-hooks/mapped-control'
import { createDocsMarkdownComponents as docsMarkdownComponents } from '@/components/shared/docs-help/docs-help-content'
import { DocsSourceLink, SuggestionCard } from '@/components/shared/docs-help/suggestion-card'

export type TDocsEvidenceControl = {
  controlId: string
  refCode?: string | null
  referenceFramework?: string | null
  source?: ControlControlSource | null
}

type Target = { refCode: string; framework: string }

export type TDocsEvidenceRequests = {
  section: string
  source: string
  target: Target
}

export function useFrameworkDocTarget(control?: TDocsEvidenceControl): { target: Target | null; isLoading: boolean } {
  const { controlId, refCode, referenceFramework, source } = control ?? {}
  const isFrameworkControl = source === ControlControlSource.FRAMEWORK && !!referenceFramework && !!refCode

  const mappingsEnabled = docsHelpEnabled && !!controlId && !isFrameworkControl
  const { mappedControlEdges, isLoading: mappingsLoading } = useGetAllMappedControlsGrouped({
    where: { or: [{ hasFromControlsWith: [{ id: controlId }] }, { hasToControlsWith: [{ id: controlId }] }] },
    enabled: mappingsEnabled,
    pageSize: 100,
    maxPages: 1,
  })

  const findMappedTarget = (): Target | null => {
    for (const edge of mappedControlEdges) {
      const sides = [edge?.node?.fromControls, edge?.node?.toControls]
      for (const side of sides) {
        for (const controlEdge of side?.edges ?? []) {
          const node = controlEdge?.node
          if (node && node.id !== controlId && node.referenceFramework && node.refCode) {
            return { refCode: node.refCode, framework: node.referenceFramework }
          }
        }
      }
    }
    return null
  }

  const target: Target | null = isFrameworkControl && refCode && referenceFramework ? { refCode, framework: referenceFramework } : findMappedTarget()
  return { target, isLoading: mappingsEnabled && mappingsLoading }
}

export type TControlDocsSection = {
  section: string | null
  source: string | null
  target: Target | null
  isLoading: boolean
}

export function useControlDocsSection(control: TDocsEvidenceControl | undefined, sectionName: string | string[]): TControlDocsSection {
  const { target, isLoading: targetLoading } = useFrameworkDocTarget(control)

  const { data, isLoading: sectionLoading } = useDocsSection(target ? `${target.framework} ${target.refCode}` : '', sectionName, docsHelpEnabled && !!target, target?.refCode)

  const isLoading = targetLoading || (!!target && sectionLoading)
  if (!target || !data?.section) return { section: null, source: null, target, isLoading }
  const isTargetPage = data.title.toLowerCase().includes(target.refCode.toLowerCase())
  if (!isTargetPage) return { section: null, source: null, target, isLoading: false }
  return { section: data.section, source: data.source, target, isLoading: false }
}

export function useDocsEvidenceRequests(control?: TDocsEvidenceControl): { requests: TDocsEvidenceRequests | null; isLoading: boolean } {
  const result = useControlDocsSection(control, ['Evidence Requests', 'Evidence Request'])
  if (!result.section || !result.source || !result.target) return { requests: null, isLoading: result.isLoading }
  return { requests: { section: result.section, source: result.source, target: result.target }, isLoading: false }
}

export function useDocsExampleEvidence(control?: TDocsEvidenceControl): { requests: TDocsEvidenceRequests | null; isLoading: boolean } {
  const result = useControlDocsSection(control, 'Example Evidence')
  if (!result.section || !result.source || !result.target) return { requests: null, isLoading: result.isLoading }
  return { requests: { section: result.section, source: result.source, target: result.target }, isLoading: false }
}

export function ExampleEvidenceRequestsCard({ requests, title = 'Example Evidence Requests', defaultOpen = true }: { requests: TDocsEvidenceRequests; title?: string; defaultOpen?: boolean }) {
  return (
    <SuggestionCard title={title} defaultOpen={defaultOpen} actions={<DocsSourceLink label={`From ${requests.target.framework} ${requests.target.refCode} docs`} />}>
      <div className="prose prose-sm dark:prose-invert mt-2 max-w-none text-sm text-muted-foreground">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={docsMarkdownComponents(requests.source)}>
          {requests.section}
        </ReactMarkdown>
      </div>
    </SuggestionCard>
  )
}
