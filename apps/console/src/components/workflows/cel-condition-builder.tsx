'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Card } from '@repo/ui/cardpanel'
import { Plus, Trash2, Code, AlertCircle, CheckCircle } from 'lucide-react'
import type { WorkflowObjectTypeMetadata } from '@/lib/graphql-hooks/workflows'
import { validateCELExpression } from '@/lib/workflow-validation'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { TRIGGER_OPERATION_OPTIONS } from '@/lib/workflow-templates'

type Operator = {
  value: string
  label: string
  requiresValue: boolean
}

const OPERATORS: Operator[] = [
  { value: '==', label: 'equals', requiresValue: true },
  { value: '!=', label: 'not equals', requiresValue: true },
  { value: '>', label: 'greater than', requiresValue: true },
  { value: '<', label: 'less than', requiresValue: true },
  { value: '>=', label: 'greater than or equal', requiresValue: true },
  { value: '<=', label: 'less than or equal', requiresValue: true },
  { value: 'contains', label: 'contains', requiresValue: true },
  { value: 'in', label: 'in', requiresValue: true },
  { value: 'matches', label: 'matches regex', requiresValue: true },
]

type Condition = {
  id: string
  field: string
  operator: string
  value: string
  logicalOperator?: 'AND' | 'OR'
}

type CELConditionBuilderProps = {
  objectType?: string
  objectTypes: WorkflowObjectTypeMetadata[]
  initialExpression?: string
  onChange: (expression: string) => void
}

type EligibleField = WorkflowObjectTypeMetadata['eligibleFields'][number]
type UserOption = ReturnType<typeof useUserSelect>['userOptions'][number]

const ConditionValueInput = ({
  condition,
  availableFields,
  userOptions,
  isLoadingUsers,
  onChange,
}: {
  condition: Condition
  availableFields: EligibleField[]
  userOptions: UserOption[]
  isLoadingUsers: boolean
  onChange: (val: string) => void
}) => {
  if (condition.field === 'user_id') {
    return (
      <Select value={condition.value} onValueChange={onChange} disabled={isLoadingUsers}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder={isLoadingUsers ? 'Loading users...' : 'Select user...'} />
        </SelectTrigger>
        <SelectContent>
          {userOptions.map((user) => (
            <SelectItem key={user.value} value={user.value}>
              {user.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (condition.field === 'event_type') {
    return (
      <Select value={condition.value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Select event type..." />
        </SelectTrigger>
        <SelectContent>
          {TRIGGER_OPERATION_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (condition.field === 'changed_fields') {
    return (
      <Select value={condition.value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Select field..." />
        </SelectTrigger>
        <SelectContent>
          {availableFields.map((field) => (
            <SelectItem key={field.name} value={field.name}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  const fieldName = condition.field.replace('object.', '')
  const field = availableFields.find((f) => f.name === fieldName)
  const fieldType = field?.type || 'string'

  if (fieldType.includes('int') || fieldType.includes('float') || fieldType.includes('number')) {
    return <Input className="h-8 text-xs" type="number" value={condition.value} onChange={(e) => onChange(e.target.value)} placeholder="Enter number" />
  }

  if (fieldType.includes('bool')) {
    return (
      <Select value={condition.value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="true/false" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">true</SelectItem>
          <SelectItem value="false">false</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  if (fieldType.includes('time') || fieldType.includes('date')) {
    return <Input className="h-8 text-xs" type="datetime-local" value={condition.value} onChange={(e) => onChange(e.target.value)} placeholder="Select date/time" />
  }

  return <Input className="h-8 text-xs" value={condition.value} onChange={(e) => onChange(e.target.value)} placeholder="Enter value" />
}

export const CELConditionBuilder = ({ objectType, objectTypes, initialExpression = '', onChange }: CELConditionBuilderProps) => {
  const [conditions, setConditions] = useState<Condition[]>([])
  const [showRawEditor, setShowRawEditor] = useState(false)
  const [rawExpression, setRawExpression] = useState(initialExpression)
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string }>({ valid: true })

  const selectedObjectType = objectTypes.find((t) => t.type === objectType)
  const availableFields = selectedObjectType?.eligibleFields || []
  const { userOptions, isLoading: isLoadingUsers } = useUserSelect({})

  const conditionsRef = useRef(conditions)
  useEffect(() => {
    conditionsRef.current = conditions
  }, [conditions])

  useEffect(() => {
    const result = validateCELExpression(rawExpression)
    setValidationResult(result)
  }, [rawExpression])

  useEffect(() => {
    if (initialExpression && initialExpression !== 'true' && conditionsRef.current.length === 0) {
      setShowRawEditor(true)
      setRawExpression(initialExpression)
    }
  }, [initialExpression])

  const generateExpression = (conds: Condition[]): string => {
    if (conds.length === 0) {
      return 'true'
    }

    const parts = conds.map((cond, idx) => {
      // eslint-disable-next-line no-useless-assignment
      let expr = ''

      if (cond.field.startsWith('object.')) {
        if (cond.operator === 'contains') {
          expr = `${cond.field}.contains("${cond.value}")`
        } else if (cond.operator === 'in') {
          expr = `${cond.field} in [${cond.value}]`
        } else if (cond.operator === 'matches') {
          expr = `${cond.field}.matches("${cond.value}")`
        } else {
          const valueIsNumber = !isNaN(Number(cond.value)) && cond.value !== ''
          const quotedValue = valueIsNumber ? cond.value : `"${cond.value}"`
          expr = `${cond.field} ${cond.operator} ${quotedValue}`
        }
      } else if (cond.field === 'changed_fields') {
        expr = `"${cond.value}" in changed_fields`
      } else {
        const valueIsNumber = !isNaN(Number(cond.value)) && cond.value !== ''
        const quotedValue = valueIsNumber ? cond.value : `"${cond.value}"`
        expr = `${cond.field} ${cond.operator} ${quotedValue}`
      }

      if (idx > 0) {
        const prevLogical = conds[idx - 1].logicalOperator || 'AND'
        return `${prevLogical === 'AND' ? '&&' : '||'} ${expr}`
      }

      return expr
    })

    return parts.join(' ')
  }

  const addCondition = () => {
    const newCondition: Condition = {
      id: `${Date.now()}`,
      field: availableFields.length > 0 ? `object.${availableFields[0].name}` : 'user_id',
      operator: '==',
      value: '',
      logicalOperator: 'AND',
    }
    const newConditions = [...conditions, newCondition]
    setConditions(newConditions)
    onChange(generateExpression(newConditions))
  }

  const removeCondition = (id: string) => {
    const newConditions = conditions.filter((c) => c.id !== id)
    setConditions(newConditions)
    onChange(generateExpression(newConditions))
  }

  const updateCondition = (id: string, field: keyof Condition, value: string) => {
    const newConditions = conditions.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    setConditions(newConditions)
    onChange(generateExpression(newConditions))
  }

  const handleRawExpressionSave = () => {
    onChange(rawExpression)
    setShowRawEditor(false)
  }

  const toggleMode = () => {
    if (!showRawEditor) {
      setRawExpression(generateExpression(conditions))
    }
    setShowRawEditor(!showRawEditor)
  }

  if (showRawEditor) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>CEL Expression</Label>
          <Button type="button" variant="outline" onClick={toggleMode}>
            Switch to Builder
          </Button>
        </div>
        <textarea
          className={`w-full p-2 text-xs font-mono border rounded-md min-h-25 ${!validationResult.valid ? 'border-destructive' : ''}`}
          value={rawExpression}
          onChange={(e) => setRawExpression(e.target.value)}
          placeholder="Enter CEL expression (e.g., object.status == 'active' && user_id != '')"
        />
        {!validationResult.valid && validationResult.error && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            {validationResult.error}
          </div>
        )}
        {validationResult.valid && rawExpression && rawExpression !== 'true' && (
          <div className="flex items-center gap-2 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" />
            Expression is valid
          </div>
        )}
        <Button type="button" variant="outline" onClick={handleRawExpressionSave} disabled={!validationResult.valid}>
          Apply Expression
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Condition Builder</Label>
        <Button type="button" variant="outline" onClick={toggleMode}>
          <Code className="h-3 w-3 mr-1" />
          Raw CEL
        </Button>
      </div>

      {conditions.length === 0 && <p className="text-xs text-muted-foreground">No conditions added. The workflow will always trigger.</p>}

      <div className="space-y-2">
        {conditions.map((condition, idx) => (
          <Card key={condition.id} className="p-3">
            {idx > 0 && (
              <div className="mb-2">
                <Select value={conditions[idx - 1].logicalOperator} onValueChange={(val) => updateCondition(conditions[idx - 1].id, 'logicalOperator', val)}>
                  <SelectTrigger className="w-20 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-[1fr_100px_1fr_32px] gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Field</Label>
                <Select value={condition.field} onValueChange={(val) => updateCondition(condition.id, 'field', val)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user_id">User ID</SelectItem>
                    <SelectItem value="event_type">Event Type</SelectItem>
                    <SelectItem value="changed_fields">Changed Fields</SelectItem>
                    {availableFields.map((field) => (
                      <SelectItem key={field.name} value={`object.${field.name}`}>
                        {field.label} ({field.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Operator</Label>
                <Select value={condition.operator} onValueChange={(val) => updateCondition(condition.id, 'operator', val)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Value</Label>
                <ConditionValueInput
                  condition={condition}
                  availableFields={availableFields}
                  userOptions={userOptions}
                  isLoadingUsers={isLoadingUsers}
                  onChange={(val) => updateCondition(condition.id, 'value', val)}
                />
              </div>

              <Button type="button" variant="iconButton" onClick={() => removeCondition(condition.id)} className="h-8 w-8 p-0">
                <Trash2 />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={addCondition} className="w-fit">
        <Plus />
        Add Condition
      </Button>

      {conditions.length > 0 && (
        <div className="mt-3 p-2 bg-muted rounded-md">
          <Label className="text-xs text-muted-foreground">Generated Expression:</Label>
          <p className="text-xs font-mono mt-1 break-all">{generateExpression(conditions)}</p>
        </div>
      )}
    </div>
  )
}
