'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { PageHeading } from '@repo/ui/page-heading'
import { Card } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { Separator } from '@repo/ui/separator'
import { Button } from '@repo/ui/button'
import { Workflow, Sparkles } from 'lucide-react'
import { WORKFLOW_TEMPLATES, type WorkflowTemplate } from '@/lib/workflow-templates'
import { toHumanLabel } from '@/utils/strings'

const categoryLabel: Record<string, string> = {
  approval: 'Approval',
  notification: 'Notification',
  lifecycle: 'Lifecycle',
}

const categoryBadgeClassName: Record<WorkflowTemplate['category'], string> = {
  approval: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  notification: 'border-sky-500/30 bg-sky-500/10 text-sky-600',
  lifecycle: 'border-amber-500/30 bg-amber-500/10 text-amber-600',
}

const actionLabelMap: Record<string, string> = {
  REQUEST_APPROVAL: 'Approval',
  REQUEST_REVIEW: 'Review',
  NOTIFY: 'Notification',
  WEBHOOK: 'Webhook',
  FIELD_UPDATE: 'Field update',
  CREATE_OBJECT: 'Create object',
}

const parseDefinition = (template: WorkflowTemplate) => {
  if (!template.definitionJSON) return undefined
  if (typeof template.definitionJSON === 'string') {
    try {
      return JSON.parse(template.definitionJSON)
    } catch {
      return undefined
    }
  }
  return template.definitionJSON
}

type TriggerData = { operation?: string; fields?: string[]; edges?: string[] }
type ActionData = { params?: { targets?: TargetData[] }; targets?: TargetData[] }
type TargetData = { type?: string; resolver_key?: string; resolverKey?: string }

const formatTrigger = (trigger?: TriggerData) => {
  if (!trigger) return '—'
  const operation = trigger.operation ? toHumanLabel(String(trigger.operation)) : '—'
  const fields = Array.isArray(trigger.fields) && trigger.fields.length > 0 ? `Fields: ${trigger.fields.join(', ')}` : ''
  const edges = Array.isArray(trigger.edges) && trigger.edges.length > 0 ? `Edges: ${trigger.edges.join(', ')}` : ''
  const detail = [fields, edges].filter(Boolean).join(' • ')
  return detail ? `${operation} · ${detail}` : operation
}

const formatTargets = (action?: ActionData) => {
  const targets = action?.params?.targets ?? action?.targets
  if (!Array.isArray(targets) || targets.length === 0) return '—'

  const labels = targets
    .map((target: TargetData) => {
      const targetType = target?.type
      if (targetType === 'RESOLVER') {
        const key = target?.resolver_key || target?.resolverKey
        return key ? toHumanLabel(String(key)) : 'Resolver'
      }
      if (targetType === 'GROUP') return 'Group'
      if (targetType === 'USER') return 'User'
      if (targetType === 'ROLE') return 'Role'
      return targetType ? toHumanLabel(String(targetType)) : null
    })
    .filter(Boolean) as string[]

  if (labels.length === 0) return '—'
  const unique = Array.from(new Set(labels))
  if (unique.length <= 2) return unique.join(', ')
  return `${unique.slice(0, 2).join(', ')} +${unique.length - 2} more`
}

const TemplateSummary = ({ template }: { template: WorkflowTemplate }) => {
  const definition = parseDefinition(template)
  const workflowKind = definition?.workflowKind ? toHumanLabel(String(definition.workflowKind)) : categoryLabel[template.category]
  const schemaType = definition?.schemaType || template.schemaType
  const triggers = Array.isArray(definition?.triggers) ? definition.triggers : []
  const actions = Array.isArray(definition?.actions) ? definition.actions : []
  const primaryAction = actions[0]
  const goal = primaryAction?.type ? (actionLabelMap[String(primaryAction.type)] ?? toHumanLabel(String(primaryAction.type))) : workflowKind

  return (
    <div className="mt-auto rounded-lg border border-border/60 bg-muted/10 p-3">
      <div className="space-y-3 text-xs text-muted-foreground">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Goal</p>
          <p className="text-sm font-medium text-foreground">{goal}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Object</p>
          <p className="text-sm font-medium text-foreground">{schemaType || '—'}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Trigger</p>
          <p className="text-sm font-medium text-foreground line-clamp-2">{formatTrigger(triggers[0])}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Targets</p>
          <p className="text-sm font-medium text-foreground">{formatTargets(primaryAction)}</p>
        </div>
      </div>
    </div>
  )
}

const WorkflowTemplatesPage = () => {
  const templates = useMemo(() => WORKFLOW_TEMPLATES, [])

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeading
        heading={
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              <h1>Workflow Templates</h1>
            </div>
            <p className="text-sm text-muted-foreground">Pick a pre-built workflow and customize it, or start from scratch. Templates map to the same definitions used by the workflow engine.</p>
          </div>
        }
      />

      <Separator className="" separatorClass="bg-card" />

      <div className="mt-6">
        <Link href="/automation/workflows/wizard" className="block">
          <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl p-4 hover:border-primary transition cursor-pointer">
            <div>
              <h2 className="text-base font-medium">Need something else?</h2>
              <p className="text-sm text-muted-foreground">Don&apos;t see a template that matches your use-case? Use our wizard to construct a definition.</p>
            </div>
            <Button variant="secondary">Open wizard</Button>
          </Card>
        </Link>
      </div>

      <div className="mt-6">
        <h2 className="mb-3">Templates</h2>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <Link key={template.id} href={`/automation/workflows/wizard?template=${template.id}`} className="h-full">
              <Card className="flex h-[360px] w-full flex-col rounded-xl overflow-hidden hover:border-primary transition cursor-pointer p-4">
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{template.name}</h3>
                    <Badge variant="outline" className={`text-xs ${categoryBadgeClassName[template.category]}`}>
                      {categoryLabel[template.category]}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>

                  <TemplateSummary template={template} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3">Custom</h2>
        <div className="flex gap-6 flex-wrap max-w-[1092px]">
          <Link className="flex flex-1" href="/automation/workflows/wizard">
            <Card className="flex w-full items-center gap-3 rounded-xl p-4 hover:border-primary transition cursor-pointer">
              <div className="flex items-center justify-center w-12 h-12 rounded-md bg-secondary border">
                <Workflow className="text-btn-primary" size={20} />
              </div>
              <div>
                <h3 className="font-medium">Start from scratch</h3>
                <p className="text-sm text-muted-foreground">Create a new workflow definition with a blank canvas.</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default WorkflowTemplatesPage
