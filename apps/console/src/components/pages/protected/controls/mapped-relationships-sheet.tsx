import React, { useMemo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { GetMappedControlsQuery, MappedControlMappingType } from '@repo/codegen/src/schema'

type MappedRelationsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  queryData: GetMappedControlsQuery
}

const MappedRelationsSheet: React.FC<MappedRelationsSheetProps> = ({ open, onOpenChange, queryData }) => {
  const mapping = queryData?.mappedControls?.edges?.[0]?.node

  const { from, to, type, confidence, relation } = useMemo(() => {
    if (!mapping) {
      return {
        from: [],
        to: {},
        type: '',
        confidence: 0,
        relation: '',
      }
    }

    const from: string[] = []
    const allFrom = [...(mapping.fromControls?.edges || []), ...(mapping.fromSubcontrols?.edges || [])]
    allFrom.forEach((e) => {
      if (e?.node) {
        if (e.node.referenceFramework) from.push(e.node.referenceFramework)
        from.push(e.node.refCode)
      }
    })

    const to: Record<string, string[]> = {}
    const addTo = (framework: string, refCode: string) => {
      if (!to[framework]) to[framework] = []
      if (!to[framework].includes(refCode)) to[framework].push(refCode)
    }
    const allTo = [...(mapping.toControls?.edges || []), ...(mapping.toSubcontrols?.edges || [])]
    allTo.forEach((e) => {
      if (e?.node) {
        const framework = e.node.referenceFramework || 'CUSTOM'
        addTo(framework, e.node.refCode)
      }
    })

    return {
      from,
      to,
      type: mapping.mappingType,
      confidence: mapping.confidence ?? 0,
      relation: mapping.relation ?? '',
    }
  }, [mapping])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-2xl p-6 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Mapped relationships</SheetTitle>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-2 gap-6">
          {/* From Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">From</label>
              <Button variant="link" size="sm" onClick={() => {}}>
                Edit
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {from.map((f) => (
                <span key={f} className="text-xs border border-gray-300 rounded-full px-2.5 py-0.5">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* To Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">To</label>
              <Button variant="link" size="sm" onClick={() => {}}>
                Edit
              </Button>
            </div>
            {Object.entries(to).map(([framework, codes]) => (
              <div key={framework} className="mb-3">
                <p className="text-xs font-medium mb-1 text-text-informational">{framework}</p>
                <div className="flex flex-wrap gap-2">
                  {codes.map((code) => (
                    <span key={code} className="text-xs border border-gray-300 rounded-full px-2.5 py-0.5">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <p className="font-medium">Type</p>
            <p>{type}</p>
          </div>

          <div>
            <p className="font-medium">Confidence</p>
            <p>{confidence}%</p>
          </div>

          <div>
            <p className="font-medium">Relation</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{relation}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default MappedRelationsSheet
