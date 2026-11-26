import { cn } from '@repo/ui/lib/utils'
import { TruncatedCell } from '@repo/ui/truncated-cell'
import { StandardsColorSpan, StandardsHexagon } from '@/components/shared/standards-color-mapper/standards-color-mapper'

type TStandardChipProps = {
  referenceFramework?: string
  className?: string
  truncate?: boolean
}

const StandardChip = ({ referenceFramework, className, truncate = false }: TStandardChipProps) => {
  const label = <StandardsColorSpan shortName={referenceFramework || ''}>{referenceFramework || 'CUSTOM'}</StandardsColorSpan>

  return (
    <div className={cn('inline-flex gap-1 items-center rounded-full px-2.5 py-0.5 border text-xs font-semibold bg-secondary transition-colors focus:outline-hidden h-fit shrink-0', className)}>
      <StandardsHexagon shortName={referenceFramework ?? ''} />
      {truncate ? (
        <TruncatedCell className="min-w-0" portal>
          {label}
        </TruncatedCell>
      ) : (
        label
      )}
    </div>
  )
}

export default StandardChip
