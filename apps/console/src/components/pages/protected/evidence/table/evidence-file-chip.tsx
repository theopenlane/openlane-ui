import React, { Fragment, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { useGetEvidenceFilesById } from '@/lib/graphql-hooks/evidence.ts'
import { File, LinkIcon } from 'lucide-react'
import { Maybe } from '@repo/codegen/src/schema.ts'

type TEvidenceFileChipProps = {
  evidenceId: string
  linkUrl?: Maybe<string>
  evidenceName: string
}

const EvidenceFileChip: React.FC<TEvidenceFileChipProps> = ({ evidenceName, evidenceId, linkUrl }) => {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <p className="text-m font-bold">{evidenceName}</p>
        </TooltipTrigger>

        {tooltipOpen && (
          <TooltipContent side="top" className="max-w-[550px]">
            <EvidenceTooltipContent linkUrl={linkUrl} evidenceId={evidenceId} />
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

type TEvidenceTooltipContentProps = {
  evidenceId: string
  linkUrl?: Maybe<string>
}

const EvidenceTooltipContent: React.FC<TEvidenceTooltipContentProps> = ({ evidenceId, linkUrl }) => {
  const { data, isLoading } = useGetEvidenceFilesById(evidenceId)

  if (isLoading) {
    return <p className="text-xs">Loading details…</p>
  }

  const evidenceFiles = data?.evidence?.files?.edges || []

  if (evidenceFiles.length === 0 && !linkUrl) {
    return <p className="text-xs">No details available.</p>
  }

  return (
    <div className="bg-background-secondary p-3 rounded-md text-xs">
      <div className="grid grid-cols-[auto_1fr] gap-y-2">
        {evidenceFiles.length > 0 && (
          <>
            {evidenceFiles.map((item, index) => {
              const extension = item?.node?.providedFileExtension
              const isImage = extension ? ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension) : null
              const borderClass = !linkUrl && index === evidenceFiles.length - 1 ? '' : 'border-b'

              return (
                <Fragment key={index}>
                  <div className={`flex items-center gap-1 pb-2 ${borderClass}`}>
                    <File size={12} />
                    <span className="font-medium">{isImage ? 'Image' : 'File'}</span>
                  </div>
                  <span className={`pl-3 text-brand text-xs hover:underline truncate block ${borderClass}`} title={item?.node?.providedFileName ?? ''}>
                    {item?.node?.providedFileName}
                  </span>
                </Fragment>
              )
            })}
          </>
        )}

        {linkUrl && (
          <>
            <div className="flex items-center gap-1">
              <LinkIcon size={12} />
              <span className="font-medium">Link</span>
            </div>
            <div className="w-full">
              <span className="size-fit pl-3 flex items-center gap-1 text-wrap">{linkUrl}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default React.memo(EvidenceFileChip)
