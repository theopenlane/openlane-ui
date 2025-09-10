import React, { useState } from 'react'
import { Badge } from '@repo/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { useGetFirstFiveEvidencesByStatus } from '@/lib/graphql-hooks/evidence.ts'
import { CircleQuestionMark, Fingerprint, Folder } from 'lucide-react'
import Link from 'next/link'
import { TChardData } from '@/components/pages/protected/evidence/chart/evidence-summary-card.tsx'
import { ChartColorsSequence } from '@/components/shared/enum-mapper/evidence-enum.tsx'
import { useSmartRouter } from '@/hooks/useSmartRouter'

type TEvidenceStatusChipProps = {
  data: TChardData
  programId: string
  index: number
}

const EvidenceStatusChip: React.FC<TEvidenceStatusChipProps> = ({ programId, index, data }) => {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <Badge className="text-white px-2 py-1 text-xs font-normal cursor-pointer" style={{ backgroundColor: ChartColorsSequence[index] }}>
            {data.name}
          </Badge>
        </TooltipTrigger>

        {tooltipOpen && (
          <TooltipContent side="top" className="max-w-[550px]">
            <EvidenceTooltipContent evidenceData={data} programId={programId} />
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

type TEvidenceTooltipContentProps = {
  evidenceData: TChardData
  programId: string
}

const EvidenceTooltipContent: React.FC<TEvidenceTooltipContentProps> = ({ programId, evidenceData }) => {
  const { data, isLoading } = useGetFirstFiveEvidencesByStatus(evidenceData.status, programId)
  const { replace } = useSmartRouter()

  if (isLoading) {
    return <p className="text-xs">Loading details…</p>
  }

  const filters = [
    {
      field: 'status',
      value: evidenceData.status,
      type: 'selectIs',
      operator: 'EQ',
      label: 'Status',
    },
  ]

  const encodedFilters = encodeURIComponent(JSON.stringify(filters))
  const evidences = data?.evidences?.edges || []
  const columnClassMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
  } as const

  const columns = Math.min(Math.max(evidences.length, 1), 3) as 1 | 2 | 3
  const columnClass = columnClassMap[columns]

  return (
    <div className="bg-background-secondary p-3 rounded-md text-xs">
      <div className="grid grid-cols-[auto_1fr] gap-y-2">
        <div className="flex items-center gap-1 border-b pb-2">
          <CircleQuestionMark size={12} />
          <span className="font-medium">Description</span>
        </div>
        <div className="w-full border-b">
          <span className="size-fit pl-3 pb-2 flex items-center gap-1">{evidenceData.description}</span>
        </div>

        <div className="flex items-center gap-1 border-b pb-2">
          <Folder size={12} />
          <span className="font-medium">Browse by filter</span>
        </div>
        <div className="w-full border-b">
          <Link href={`/evidence?${programId ? `programId=${programId}&` : ''}regularFilters=${encodedFilters}&filterActive=1`}>
            <span className="text-brand size-fit pl-3 pb-2 hover:underline flex items-center gap-1 cursor-pointer">{evidenceData.name}</span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <Fingerprint size={12} />
          <span className="font-medium">Evidence</span>
        </div>

        {evidences.length === 0 && <span className="pl-3 text-brand text-xs">No evidence available.</span>}
        {evidences.length > 0 && (
          <div className={`grid gap-2 pl-3 ${columnClass}`}>
            {evidences.map((item, index) => (
              <span key={index} className="pr-1 text-brand text-xs hover:underline cursor-pointer" onClick={() => replace({ id: item?.node?.id || '' })}>
                {item?.node?.displayID}
              </span>
            ))}

            {evidenceData.value > 5 && (
              <div className="flex items-center">
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs fborder hover:bg-muted/80 transition cursor-pointer">
                  <span>+{evidenceData.value - 5} more</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(EvidenceStatusChip)
