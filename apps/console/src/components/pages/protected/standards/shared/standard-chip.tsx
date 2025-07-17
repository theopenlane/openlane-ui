import { StandardsColorSpan, StandardsHexagon } from '@/components/shared/standards-color-mapper/standards-color-mapper'

type TStandardChipProps = {
  referenceFramework?: string
}

const StandardChip = ({ referenceFramework }: TStandardChipProps) => {
  return (
    <div className="inline-flex gap-1 items-center rounded-full px-2.5 py-0.5 border border-border text-xs font-semibold ransition-colors focus:outline-none h-fit">
      <StandardsHexagon shortName={referenceFramework ?? ''} />
      <StandardsColorSpan shortName={referenceFramework || ''}>{referenceFramework || 'CUSTOM'}</StandardsColorSpan>
    </div>
  )
}

export default StandardChip
