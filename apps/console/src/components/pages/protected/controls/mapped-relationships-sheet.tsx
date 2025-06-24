import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { GetMappedControlsQuery, MappedControlMappingType } from '@repo/codegen/src/schema'
import { RelatedControlChip } from './shared/related-control-chip'
import { MappingIconMapper } from '@/components/shared/icon-enum/map-control-enum'

type MappedRelationsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  queryData: GetMappedControlsQuery
}

const MappedRelationsSheet: React.FC<MappedRelationsSheetProps> = ({ open, onOpenChange, queryData }) => {
  const mappings = queryData?.mappedControls?.edges?.map((e) => e?.node).filter(Boolean)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-3xl p-6 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="self-start">Mapped relationships</SheetTitle>
        </SheetHeader>

        {(!mappings || mappings.length === 0) && <p className="text-sm mt-4">No mapping data available.</p>}

        {mappings?.map((mapping, i) => {
          const from: Record<string, string[]> = {}
          const to: Record<string, string[]> = {}

          const addToMap = (map: Record<string, string[]>, framework: string, refCode: string) => {
            if (!map[framework]) map[framework] = []
            if (!map[framework].includes(refCode)) map[framework].push(refCode)
          }

          const allFrom = [...(mapping?.fromControls?.edges || []), ...(mapping?.fromSubcontrols?.edges || [])]
          const allTo = [...(mapping?.toControls?.edges || []), ...(mapping?.toSubcontrols?.edges || [])]

          allFrom.forEach((e) => {
            if (e?.node) {
              const framework = e.node.referenceFramework || 'CUSTOM'
              addToMap(from, framework, e.node.refCode)
            }
          })

          allTo.forEach((e) => {
            if (e?.node) {
              const framework = e.node.referenceFramework || 'CUSTOM'
              addToMap(to, framework, e.node.refCode)
            }
          })

          return (
            <RelationCard
              key={i}
              data={{
                from,
                to,
                type: mapping?.mappingType as MappedControlMappingType,
                confidence: mapping?.confidence ?? 0,
                relation: mapping?.relation ?? '',
              }}
            />
          )
        })}
      </SheetContent>
    </Sheet>
  )
}

export default MappedRelationsSheet

const RelationCard = ({
  data,
}: {
  data: {
    from: Record<string, string[]>
    to: Record<string, string[]>
    type: MappedControlMappingType
    confidence: number
    relation: string
  }
}) => {
  return (
    <div className="border rounded-md p-4 mt-5">
      <div>
        <div className=" border-b">
          <div className="flex items-center">
            <div className="flex gap-4 w-40 shrink-0 self-start items-center">
              <label className="text-sm">From</label>
              <span className="text-brand cursor-pointer text-xs">(Edit)</span>
            </div>
            <div className="flex flex-col gap-2">
              {Object.entries(data.from).map(([framework, codes], index, array) => (
                <div key={framework} className={`flex w-full pb-2 ${index < array.length - 1 ? 'border-b border-dotted' : ''}`}>
                  <p className="text-xs font-medium text-text-informational w-28 shrink-0 mt-1">{framework}</p>
                  <div className="flex flex-wrap gap-2">
                    {codes.map((code) => (
                      <RelatedControlChip key={code} refCode={code} href="#" mappingType={data.type} relation={data.relation} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-2 border-b">
          <div className="flex items-center">
            <div className="flex gap-4 w-40 shrink-0 self-start items-center">
              <label className="text-sm">To</label>
              <span className="text-brand cursor-pointer text-xs">(Edit)</span>
            </div>
            <div className="flex flex-col gap-2">
              {Object.entries(data.to).map(([framework, codes], index, array) => (
                <div key={framework} className={`flex w-full pb-2 ${index < array.length - 1 ? 'border-b border-dotted' : ''}`}>
                  <p className="text-xs font-medium text-text-informational w-28 shrink-0 mt-1">{framework}</p>
                  <div className="flex flex-wrap gap-2">
                    {codes.map((code) => (
                      <RelatedControlChip key={code} refCode={code} href="#" mappingType={data.type} relation={data.relation} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="">
        <div className="flex items-center border-b py-2">
          <p className="flex gap-4 w-40 shrink-0 self-start items-center text-sm">Type</p>
          {data.type && <div className="h-2.5 w-2.5 bg-card flex items-center justify-center rounded-full">{MappingIconMapper[data.type]}</div>}
          <p className="capitalize ml-2 text-sm">{data.type.toLowerCase()}</p>
        </div>
        <div className="flex items-center border-b py-2">
          <p className="flex gap-4 w-40 shrink-0 self-start items-center text-sm">Confidence</p>
          <p className="text-sm">{data.confidence}%</p>
        </div>
        <div className="flex pt-2">
          <p className="flex gap-4 w-40 shrink-0 self-start items-center text-sm">Relation</p>
          <p className="text-sm whitespace-pre-wrap text-sm">{data.relation}</p>
        </div>
      </div>
    </div>
  )
}
