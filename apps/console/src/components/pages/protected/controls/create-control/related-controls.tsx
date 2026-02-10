'use client'

import React, { useMemo } from 'react'
import MapControlDialog from './map-control-dialog'
import { Card } from '@repo/ui/cardpanel'
import StandardChip from '../../standards/shared/standard-chip'
import { RelatedControlChip } from '../shared/related-control-chip'
import { Control, Subcontrol } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'

export type RelatedNode = {
  type: typeof ObjectTypes.CONTROL | typeof ObjectTypes.SUBCONTROL
  id: string
  refCode: string
  referenceFramework?: string | null
}

export type GroupedControls = Record<string, RelatedNode[]>

interface RelatedControlsProps {
  onSave: (arg: { controls: Control[]; subcontrols: Subcontrol[] }) => void
  mappedControls: { controls: Control[]; subcontrols: Subcontrol[] }
}

const RelatedControls = ({ mappedControls, onSave }: RelatedControlsProps) => {
  const grouped = useMemo(() => {
    const groups: GroupedControls = {}

    const processNode = (node: Control | Subcontrol, type: typeof ObjectTypes.CONTROL | typeof ObjectTypes.SUBCONTROL) => {
      const framework = node.referenceFramework || 'CUSTOM'
      if (!groups[framework]) groups[framework] = []

      groups[framework].push({
        id: node.id,
        type: type,
        refCode: node.refCode,
        referenceFramework: node.referenceFramework,
      })
    }

    mappedControls.controls?.forEach((c) => processNode(c, ObjectTypes.CONTROL))
    mappedControls.subcontrols?.forEach((s) => processNode(s, ObjectTypes.SUBCONTROL))

    return groups
  }, [mappedControls])

  const handleSave = (arg: { controls: Control[]; subcontrols: Subcontrol[] }) => {
    onSave(arg)
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-5">
        <p className="text-lg font-semibold">Related Controls</p>
        <MapControlDialog mappedControls={mappedControls} onSave={handleSave} />
      </div>

      <div className="space-y-1">
        {Object.entries(grouped).length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No controls mapped yet.</p>
        ) : (
          Object.entries(grouped).map(([framework, nodes], index, array) => (
            <div key={framework} className={`flex gap-5 items-start pb-1.5 ${index < array.length - 1 ? 'border-b' : ''}`}>
              <div className="min-w-[120px]">
                <StandardChip referenceFramework={framework} />
              </div>

              <div className="flex gap-2.5 flex-wrap mt-0.5">
                {nodes.map((node) => (
                  <RelatedControlChip key={`${node.type}-${node.id}`} refCode={node.refCode} hidePencil />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

export default RelatedControls
