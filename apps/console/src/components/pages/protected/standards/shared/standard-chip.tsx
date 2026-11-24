import { StandardsColorSpan, StandardsHexagon } from '@/components/shared/standards-color-mapper/standards-color-mapper'
import { cn } from '@repo/ui/lib/utils'

type TStandardChipSize = 'default' | 'lg'

type TStandardChipProps = {
  referenceFramework?: string
  size?: TStandardChipSize
}

const SIZES: Record<TStandardChipSize, { className: string; hexagon: number }> = {
  default: { className: 'gap-1 px-2.5 py-0.5 text-xs', hexagon: 10 },
  lg: { className: 'gap-1.5 px-3 py-1 text-sm', hexagon: 12 },
}

const StandardChip = ({ referenceFramework, size = 'default' }: TStandardChipProps) => {
  return (
    <div className={cn('inline-flex items-center rounded-full border font-semibold bg-secondary transition-colors focus:outline-hidden h-fit shrink-0', SIZES[size].className)}>
      <StandardsHexagon shortName={referenceFramework ?? ''} size={SIZES[size].hexagon} />
      <StandardsColorSpan shortName={referenceFramework || ''}>{referenceFramework || 'CUSTOM'}</StandardsColorSpan>
    </div>
  )
}

export default StandardChip
