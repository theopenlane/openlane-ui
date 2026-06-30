import { Badge } from '@repo/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { EVIDENCE_STATUS_STYLES } from '@/components/shared/enum-mapper/evidence-enum'
import { type EvidenceEvidenceStatus } from '@repo/codegen/src/schema'

type EvidenceRef = { id: string; name: string; status?: string | null }

type LinkedEvidenceCellProps = {
  evidenceRefs?: EvidenceRef[]
  stopPropagation?: boolean
}

const EvidenceBadge = ({ item }: { item: EvidenceRef }) => {
  const style = item.status ? EVIDENCE_STATUS_STYLES[item.status as EvidenceEvidenceStatus] : undefined
  return (
    <Badge variant="secondary" className="text-xs font-normal" style={style ? { backgroundColor: style.bg, color: style.color } : undefined}>
      {item.name}
    </Badge>
  )
}

const LinkedEvidenceCell = ({ evidenceRefs = [], stopPropagation = false }: LinkedEvidenceCellProps) => {
  const handleClick = stopPropagation ? (e: React.MouseEvent) => e.stopPropagation() : undefined

  if (evidenceRefs.length === 0) {
    return <span className="text-muted-foreground italic text-sm">None linked</span>
  }

  if (evidenceRefs.length === 1) {
    return (
      <span onClick={handleClick}>
        <EvidenceBadge item={evidenceRefs[0]} />
      </span>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="text-xs font-normal cursor-default" onClick={handleClick}>
            {evidenceRefs.length} evidence items
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs space-y-1">
            <p className="font-semibold mb-1">Linked evidence</p>
            {evidenceRefs.map((item) => (
              <div key={item.id}>
                <EvidenceBadge item={item} />
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default LinkedEvidenceCell
