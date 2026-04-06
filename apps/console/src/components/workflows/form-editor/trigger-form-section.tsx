'use client'

import { Plus, Trash2, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Badge } from '@repo/ui/badge'
import { TRIGGER_OPERATION_OPTIONS } from '@/lib/workflow-templates'
import type { WorkflowObjectTypeMetadata } from '@/lib/graphql-hooks/workflows'
import type { UpdateWorkflowTrigger, WorkflowTrigger, WorkflowTriggerOperation } from '@/types/workflow'

type TriggerFormSectionProps = {
  triggers: WorkflowTrigger[]
  objectTypes: WorkflowObjectTypeMetadata[]
  eligibleEdgesByType: Map<string, string[]>
  edgeInputs: Record<number, string>
  onAddTrigger: () => void
  onRemoveTrigger: (index: number) => void
  onUpdateTrigger: UpdateWorkflowTrigger
  onUpdateEdgeInput: (index: number, value: string) => void
  onAddEdge: (index: number) => void
  onRemoveEdge: (index: number, edge: string) => void
}

export const TriggerFormSection = ({
  triggers,
  objectTypes,
  eligibleEdgesByType,
  edgeInputs,
  onAddTrigger,
  onRemoveTrigger,
  onUpdateTrigger,
  onUpdateEdgeInput,
  onAddEdge,
  onRemoveEdge,
}: TriggerFormSectionProps) => {
  return (
    <Card className="border border-muted-foreground/30">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="p-0">Triggers</CardTitle>
            <CardDescription>Define when this workflow should execute.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={onAddTrigger}>
            <Plus className="h-4 w-4 mr-1" />
            Add trigger
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {triggers.map((trigger, index) => {
          const eligibleEdges = eligibleEdgesByType.get(trigger.objectType) ?? []
          const hasEligibleEdges = eligibleEdges.length > 0

          return (
            <Card key={`trigger-${index}`} className="border-dashed">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="p-0 text-sm">Trigger {index + 1}</CardTitle>
                  {triggers.length > 1 && (
                    <Button size="sm" variant="transparent" onClick={() => onRemoveTrigger(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Operation</Label>
                    <Select value={trigger.operation} onValueChange={(val) => onUpdateTrigger(index, 'operation', val as WorkflowTriggerOperation)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIGGER_OPERATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Object type</Label>
                    <Select value={trigger.objectType} onValueChange={(val) => onUpdateTrigger(index, 'objectType', val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select object type" />
                      </SelectTrigger>
                      <SelectContent>
                        {objectTypes.map((objType) => (
                          <SelectItem key={objType.type} value={objType.type}>
                            {objType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tracked fields (leave empty for all)</Label>
                  {trigger.objectType && objectTypes.find((t) => t.type === trigger.objectType)?.eligibleFields.length ? (
                    <div className="space-y-2 border rounded-md p-3">
                      {objectTypes
                        .find((t) => t.type === trigger.objectType)
                        ?.eligibleFields.map((field) => (
                          <div key={field.name} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`trigger-${index}-field-${field.name}`}
                              checked={trigger.fields?.includes(field.name) || false}
                              onChange={(e) => {
                                const currentFields = trigger.fields ?? []
                                const newFields = e.target.checked ? [...currentFields, field.name] : currentFields.filter((currentField) => currentField !== field.name)
                                onUpdateTrigger(index, 'fields', newFields)
                              }}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <label htmlFor={`trigger-${index}-field-${field.name}`} className="text-xs font-medium">
                              {field.label}
                            </label>
                          </div>
                        ))}
                      <p className="text-xs text-muted-foreground mt-2">{trigger.fields?.length ? `${trigger.fields.length} field(s) selected` : 'No fields selected (tracks all fields)'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground border rounded-md p-3">
                      {trigger.objectType ? 'No workflow-eligible fields for this object type' : 'Select an object type to see available fields'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tracked edges (optional)</Label>
                  {hasEligibleEdges ? (
                    <div className="flex gap-2">
                      <Select value={edgeInputs[index] || ''} onValueChange={(val) => onUpdateEdgeInput(index, val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an edge" />
                        </SelectTrigger>
                        <SelectContent>
                          {eligibleEdges.map((edge) => (
                            <SelectItem key={edge} value={edge}>
                              {edge}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" onClick={() => onAddEdge(index)} disabled={!edgeInputs[index]?.trim()}>
                        Add
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input value={edgeInputs[index] || ''} onChange={(e) => onUpdateEdgeInput(index, e.target.value)} placeholder="controls" />
                      <Button type="button" variant="outline" onClick={() => onAddEdge(index)} disabled={!edgeInputs[index]?.trim()}>
                        Add
                      </Button>
                    </div>
                  )}
                  {Array.isArray(trigger.edges) && trigger.edges.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {trigger.edges.map((edge) => (
                        <Badge key={edge} variant="secondary" className="gap-1">
                          {edge}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => onRemoveEdge(index, edge)} />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Edge names map to schema relations (for example: controls, evidence).</p>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={trigger.description} onChange={(e) => onUpdateTrigger(index, 'description', e.target.value)} placeholder="When to trigger this workflow" />
                </div>

                <div className="space-y-2">
                  <Label>CEL expression (optional)</Label>
                  <Textarea value={trigger.expression} onChange={(e) => onUpdateTrigger(index, 'expression', e.target.value)} placeholder="true" rows={2} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </CardContent>
    </Card>
  )
}
