'use client'

import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Card } from '@repo/ui/cardpanel'
import { AlertCircle } from 'lucide-react'

type TriggerNodeData = {
  operation: string
  objectType: string
  fields?: string[]
  edges?: string[]
  expression?: string
  description?: string
}

export const TriggerNode = memo(({ data, selected }: NodeProps<Node<TriggerNodeData>>) => {
  const hasWarning = !data.operation || !data.objectType

  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-primary' : ''} ${hasWarning ? 'border-amber-500' : ''}`}>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-xs font-semibold text-blue-600 uppercase">Trigger</span>
          {hasWarning && <AlertCircle className="h-3 w-3 text-amber-500 ml-auto" />}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {data.operation} {data.objectType}
          </p>
          {data.description && <p className="text-xs text-muted-foreground">{data.description}</p>}
          {data.fields && data.fields.length > 0 && <p className="text-xs text-muted-foreground">Fields: {data.fields.join(', ')}</p>}
          {data.edges && data.edges.length > 0 && <p className="text-xs text-muted-foreground">Edges: {data.edges.join(', ')}</p>}
          {data.expression && <p className="text-xs text-muted-foreground">When: {data.expression}</p>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </Card>
  )
})

TriggerNode.displayName = 'TriggerNode'
