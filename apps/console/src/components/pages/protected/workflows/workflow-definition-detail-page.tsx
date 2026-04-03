'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Textarea } from '@repo/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { useWorkflowDefinition } from '@/lib/graphql-hooks/workflow-definition'
import { useWorkflowMetadata } from '@/lib/graphql-hooks/workflows'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { formatDateSince } from '@/utils/date'
import { definitionHasApprovalAction, formatApprovalTimingLabel, parseWorkflowDefinition, resolveApprovalTiming } from '@/utils/workflow'
import { WorkflowVisualEditor } from '@/components/workflows/workflow-visual-editor'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const WorkflowDefinitionDetailPage = () => {
  const router = useRouter()
  const params = useParams()
  const workflowId = params.id as string | undefined

  const { data: definition, isLoading } = useWorkflowDefinition(workflowId)
  const { objectTypes } = useWorkflowMetadata()
  const { setCrumbs } = React.use(BreadcrumbContext)
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual')

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation/workflows' },
      { label: 'Workflows', href: '/automation/workflows' },
      { label: definition?.workflowDefinition?.name, isLoading },
    ])
  }, [setCrumbs, definition?.workflowDefinition?.name, isLoading])

  const definitionDoc = useMemo(() => parseWorkflowDefinition(definition?.workflowDefinition?.definitionJSON), [definition?.workflowDefinition?.definitionJSON])
  const actions = useMemo(() => (Array.isArray(definitionDoc?.actions) ? definitionDoc.actions : []), [definitionDoc])
  const actionSummary = useMemo(() => {
    if (!actions.length) return '—'
    const labels = actions
      .map((action) => {
        const type = String(action?.type ?? '').toUpperCase()
        if (type === 'REQUEST_APPROVAL' || type === 'APPROVAL') return 'Approval'
        if (type === 'REQUEST_REVIEW' || type === 'REVIEW') return 'Review'
        if (type === 'NOTIFY') return 'Notification'
        if (type === 'WEBHOOK') return 'Webhook'
        if (type === 'UPDATE_FIELD' || type === 'FIELD_UPDATE') return 'Field update'
        return action?.type ? String(action.type) : 'Action'
      })
      .filter(Boolean)
    return Array.from(new Set(labels)).join(', ')
  }, [actions])

  const hasApprovalAction = useMemo(() => definitionHasApprovalAction(definitionDoc), [definitionDoc])
  const approvalTiming = useMemo(() => resolveApprovalTiming(definitionDoc), [definitionDoc])
  const approvalTimingLabel = useMemo(() => formatApprovalTimingLabel(approvalTiming), [approvalTiming])

  const definitionJSON = useMemo(() => {
    if (!definition?.workflowDefinition?.definitionJSON) return ''
    return typeof definition.workflowDefinition.definitionJSON === 'string' ? definition.workflowDefinition.definitionJSON : JSON.stringify(definition.workflowDefinition.definitionJSON, null, 2)
  }, [definition])

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading workflow definition...</p>
  }

  if (!definition?.workflowDefinition) {
    return <p className="text-sm text-muted-foreground">Workflow definition not found.</p>
  }

  return (
    <div className="space-y-6">
      <PageHeading
        heading={
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1>{definition.workflowDefinition?.name}</h1>
              <p className="text-sm mt-2">{definition.workflowDefinition?.description || 'Workflow definition details'}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => router.push('/automation/workflows')}>
                Back to definitions
              </Button>
              <Button onClick={() => router.push(`/automation/workflows/editor?id=${definition.workflowDefinition?.id}`)}>Edit definition</Button>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-0">
            <CardTitle className="p-0">Definition overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Schema</p>
              <p className="font-medium">{definition.workflowDefinition?.schemaType}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Kind</p>
              <p className="font-medium">{getEnumLabel(definition.workflowDefinition?.workflowKind)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Action summary</p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{actionSummary}</p>
                {hasApprovalAction && (
                  <Badge variant="outline" className="text-xs">
                    {approvalTimingLabel}
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">{definition.workflowDefinition?.draft ? 'Draft' : definition.workflowDefinition?.active ? 'Active' : 'Inactive'}</Badge>
                {definition.workflowDefinition?.isDefault && <Badge variant="outline">Default</Badge>}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Updated</p>
              <p className="font-medium">{formatDateSince(definition.workflowDefinition?.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="p-0">Definition</CardTitle>
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'visual' | 'json')}>
                <TabsList>
                  <TabsTrigger value="visual">Visual</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className={viewMode === 'visual' ? '' : 'hidden'}>
              <WorkflowVisualEditor
                triggers={Array.isArray(definitionDoc?.triggers) ? definitionDoc.triggers : []}
                conditions={Array.isArray(definitionDoc?.conditions) ? definitionDoc.conditions : []}
                actions={actions}
                objectTypes={objectTypes}
                readOnly
              />
            </div>
            <div className={viewMode === 'json' ? '' : 'hidden'}>
              <Textarea readOnly value={definitionJSON} className="font-mono text-xs" rows={18} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default WorkflowDefinitionDetailPage
