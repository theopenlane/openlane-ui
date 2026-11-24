import { StandardsColorSpan, StandardsHexagon } from '@/components/shared/standards-color-mapper/standards-color-mapper'

type TStandardChipProps = {
  referenceFramework?: string
}

const StandardChip = ({ referenceFramework }: TStandardChipProps) => {
  return (
    <div className="inline-flex gap-1 items-center rounded-full px-2.5 py-0.5 border text-xs font-semibold bg-secondary transition-colors focus:outline-hidden h-fit shrink-0">
      <StandardsHexagon shortName={referenceFramework ?? ''} />
      <StandardsColorSpan shortName={referenceFramework || ''}>{referenceFramework || 'CUSTOM'}</StandardsColorSpan>
    </div>
  )
}

export default StandardChip
