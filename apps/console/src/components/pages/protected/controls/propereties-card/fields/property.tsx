import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import StandardChip from '../../../standards/shared/standard-chip'
import { PropertyRow } from '@/components/shared/property-row/property-row'
import { controlIconsMap } from '@/components/shared/enum-mapper/control-enum'

export const Property = ({ label, value, onPencilClick }: { label: string; value?: string | null; onPencilClick?: () => void }) => (
  <PropertyRow icon={controlIconsMap[label]} label={label}>
    {label === 'Framework' ? (
      <div className="cursor-not-allowed">
        <StandardChip referenceFramework={value ?? ''} />
      </div>
    ) : (
      <HoverPencilWrapper showPencil={!!onPencilClick} onPencilClick={onPencilClick}>
        <div className="text-sm whitespace-pre-line">{value || '-'}</div>
      </HoverPencilWrapper>
    )}
  </PropertyRow>
)
