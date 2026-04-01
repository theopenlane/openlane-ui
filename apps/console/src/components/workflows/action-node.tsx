'use client'

import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Card } from '@repo/ui/cardpanel'
import { AlertCircle } from 'lucide-react'

type ActionNodeData = {
  type: string
  key: string
  description?: string
  params?: { label?: string; targets?: { type: string; id?: string }[] } & Record<string, unknown>
  when?: string
}

export const ActionNode = memo(({ data, selected }: NodeProps<Node<ActionNodeData>>) => {
  const targets = Array.isArray(data.params?.targets) ? data.params.targets : []
  const isApprovalLike = data.type === 'REQUEST_APPROVAL' || data.type === 'REVIEW'
  const hasWarning = !data.type || !data.key || (isApprovalLike && targets.length === 0)

  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-primary' : ''} ${hasWarning ? 'border-amber-500' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs font-semibold text-green-600 uppercase">Action</span>
          {hasWarning && <AlertCircle className="h-3 w-3 text-amber-500 ml-auto" />}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{data.type.replace(/_/g, ' ')}</p>
          {data.description && <p className="text-xs text-muted-foreground">{data.description}</p>}
          {isApprovalLike && data.params?.label && <p className="text-xs text-muted-foreground">Label: {data.params.label}</p>}
          {isApprovalLike && targets.length > 0 && <p className="text-xs text-muted-foreground">Targets: {targets.length}</p>}
          {data.when && <p className="text-xs text-muted-foreground">When: {data.when}</p>}
        </div>
      </div>
    </Card>
  )
})

ActionNode.displayName = 'ActionNode'
