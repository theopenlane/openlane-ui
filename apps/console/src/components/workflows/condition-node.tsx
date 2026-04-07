'use client'

import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Card } from '@repo/ui/cardpanel'
import { AlertCircle } from 'lucide-react'

type ConditionNodeData = {
  expression: string
  description?: string
}

export const ConditionNode = memo(({ data, selected }: NodeProps<Node<ConditionNodeData>>) => {
  const hasWarning = !data.expression || data.expression.trim() === ''

  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-primary' : ''} ${hasWarning ? 'border-amber-500' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-xs font-semibold text-amber-600 uppercase">Condition</span>
          {hasWarning && <AlertCircle className="h-3 w-3 text-amber-500 ml-auto" />}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-mono bg-muted p-1 rounded">{data.expression}</p>
          {data.description && <p className="text-xs text-muted-foreground">{data.description}</p>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </Card>
  )
})

ConditionNode.displayName = 'ConditionNode'
