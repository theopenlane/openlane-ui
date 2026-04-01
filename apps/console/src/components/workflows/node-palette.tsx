'use client'

import type { DragEvent } from 'react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Plus, Search } from 'lucide-react'

type NodePaletteProps = {
  onAddNode: (type: 'trigger' | 'condition' | 'action') => void
}

const NODE_TYPES = [
  { type: 'trigger' as const, label: 'Trigger', color: 'bg-blue-500' },
  { type: 'condition' as const, label: 'Condition', color: 'bg-amber-500' },
  { type: 'action' as const, label: 'Action', color: 'bg-green-500' },
]

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const [search, setSearch] = useState('')

  const filteredNodes = NODE_TYPES.filter((node) => node.label.toLowerCase().includes(search.toLowerCase()))

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, nodeType: 'trigger' | 'condition' | 'action') => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <Card className="w-64">
      <CardHeader>
        <CardTitle className="text-sm">Add Node</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search nodes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        {filteredNodes.map((node) => (
          <Button key={node.type} variant="outline" className="w-full justify-start" onClick={() => onAddNode(node.type)} draggable onDragStart={(event) => handleDragStart(event, node.type)}>
            <div className={`h-3 w-3 rounded-full ${node.color} mr-2`} />
            <Plus className="h-3 w-3 mr-1" />
            {node.label}
          </Button>
        ))}
        {filteredNodes.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No nodes found</p>}
      </CardContent>
    </Card>
  )
}
