import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import StandardChip from '../../../standards/shared/standard-chip'
import { controlIconsMap } from '@/components/shared/enum-mapper/control-enum'

export const Property = ({ label, value, onPencilClick }: { label: string; value?: string | null; onPencilClick?: () => void }) => (
  <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 border-b border-border pb-3">
    <div className="flex items-start gap-2">
      <div className="pt-0.5">{controlIconsMap[label]}</div>
      <div className="text-sm">{label}</div>
    </div>
    <div className="text-sm whitespace-pre-line relative group">
      {label === 'Framework' ? (
        <div className="cursor-not-allowed">
          <StandardChip referenceFramework={value ?? ''} />
        </div>
      ) : (
        <HoverPencilWrapper onPencilClick={onPencilClick}>
          <div className="text-sm whitespace-pre-line">{value || '-'}</div>
        </HoverPencilWrapper>
      )}
    </div>
  </div>
)
