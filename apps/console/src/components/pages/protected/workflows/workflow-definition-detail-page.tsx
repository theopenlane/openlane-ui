'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Textarea } from '@repo/ui/textarea'
import { useWorkflowDefinition } from '@/lib/graphql-hooks/workflows'
import { formatDateSince } from '@/utils/date'
import { definitionHasApprovalAction, formatApprovalTimingLabel, parseWorkflowDefinition, resolveApprovalTiming } from '@/utils/workflow'

type WorkflowDefinitionDetailPageProps = {
  workflowId: string
}

const WorkflowDefinitionDetailPage = ({ workflowId }: WorkflowDefinitionDetailPageProps) => {
  const router = useRouter()
  const { definition, isLoading } = useWorkflowDefinition(workflowId)

  const definitionDoc = useMemo(() => parseWorkflowDefinition(definition?.definitionJSON), [definition?.definitionJSON])
  const actions = useMemo(() => (Array.isArray(definitionDoc?.actions) ? definitionDoc.actions : []), [definitionDoc])
  const actionSummary = useMemo(() => {
    if (!actions.length) return '—'
    const labels = actions
      .map((action) => {
        const type = String(action?.type ?? '').toUpperCase()
        if (type === 'REQUEST_APPROVAL' || type === 'APPROVAL') return 'Approval'
        if (type === 'REVIEW') return 'Review'
        if (type === 'NOTIFY') return 'Notification'
        if (type === 'WEBHOOK') return 'Webhook'
        if (type === 'FIELD_UPDATE') return 'Field update'
        return action?.type ? String(action.type) : 'Action'
      })
      .filter(Boolean)
    return Array.from(new Set(labels)).join(', ')
  }, [actions])

  const hasApprovalAction = useMemo(() => definitionHasApprovalAction(definitionDoc), [definitionDoc])
  const showTiming = hasApprovalAction
  const approvalTiming = useMemo(() => resolveApprovalTiming(definitionDoc), [definitionDoc])
  const approvalTimingLabel = useMemo(() => formatApprovalTimingLabel(approvalTiming), [approvalTiming])

  const definitionJSON = useMemo(() => {
    if (!definition?.definitionJSON) return ''
    return typeof definition.definitionJSON === 'string'
      ? definition.definitionJSON
      : JSON.stringify(definition.definitionJSON, null, 2)
  }, [definition])

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading workflow definition...</p>
  }

  if (!definition) {
    return <p className="text-sm text-muted-foreground">Workflow definition not found.</p>
  }

  return (
    <div className="space-y-6">
      <PageHeading
        heading={
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1>{definition.name}</h1>
              <p className="text-sm text-muted-foreground">{definition.description || 'Workflow definition details'}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => router.push('/workflows')}>
                Back to definitions
              </Button>
              <Button onClick={() => router.push(`/workflows/editor?id=${definition.id}`)}>Edit definition</Button>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Definition overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Schema</p>
              <p className="font-medium">{definition.schemaType}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Kind</p>
              <p className="font-medium">{definition.workflowKind}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Action summary</p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{actionSummary}</p>
                {showTiming && <Badge variant="outline" className="text-xs">{approvalTimingLabel}</Badge>}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{definition.draft ? 'Draft' : definition.active ? 'Active' : 'Inactive'}</Badge>
                {definition.isDefault && <Badge variant="outline">Default</Badge>}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Updated</p>
              <p className="font-medium">{formatDateSince(definition.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Definition JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea readOnly value={definitionJSON} className="font-mono text-xs" rows={18} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default WorkflowDefinitionDetailPage
