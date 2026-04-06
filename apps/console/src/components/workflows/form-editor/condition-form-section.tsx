'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import type { WorkflowObjectTypeMetadata } from '@/lib/graphql-hooks/workflows'
import { CELConditionBuilder } from '@/components/workflows/cel-condition-builder'
import type { UpdateWorkflowCondition, WorkflowCondition } from '@/types/workflow'

type ConditionFormSectionProps = {
  conditions: WorkflowCondition[]
  objectTypes: WorkflowObjectTypeMetadata[]
  schemaType: string
  onAddCondition: () => void
  onRemoveCondition: (index: number) => void
  onUpdateCondition: UpdateWorkflowCondition
}

export const ConditionFormSection = ({ conditions, objectTypes, schemaType, onAddCondition, onRemoveCondition, onUpdateCondition }: ConditionFormSectionProps) => {
  return (
    <Card className="border border-muted-foreground/30">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="p-0">Conditions</CardTitle>
            <CardDescription>CEL expressions that must evaluate to true for the workflow to proceed.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={onAddCondition}>
            <Plus className="h-4 w-4 mr-1" />
            Add condition
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {conditions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No conditions. Workflow will always execute when triggered.</p>
        ) : (
          conditions.map((condition, index) => (
            <Card key={`condition-${index}`} className="border-dashed">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="p-0 text-sm">Condition {index + 1}</CardTitle>
                  <Button size="sm" variant="transparent" onClick={() => onRemoveCondition(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CELConditionBuilder
                  objectType={schemaType}
                  objectTypes={objectTypes}
                  initialExpression={condition.expression || 'true'}
                  onChange={(expression) => onUpdateCondition(index, 'expression', expression)}
                />
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={condition.description} onChange={(e) => onUpdateCondition(index, 'description', e.target.value)} placeholder="Explain when this condition passes" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  )
}
