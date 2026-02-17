import { ButtonSkeleton } from '@/components/shared/skeleton/button-skeleton'
import { LabelSkeleton } from '@/components/shared/skeleton/label-skeleton'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { TitleSkeleton } from '@/components/shared/skeleton/title-skeleton'

interface GenericDetailsSheetSkeletonProps {
  fieldCount?: number
  showButtons?: boolean
  labelPairCount?: number
}

export const GenericDetailsSheetSkeleton = ({ fieldCount = 4, showButtons = true, labelPairCount = 6 }: GenericDetailsSheetSkeletonProps) => {
  return (
    <div className="flex flex-col mt-2 gap-2">
      <div className="flex flex-col mb-1">
        <TitleSkeleton />
      </div>

      {/* Field skeletons */}
      {Array.from({ length: fieldCount }).map((_, i) => (
        <Skeleton key={`field-${i}`} height={50} width={i === 0 ? 500 : 200} />
      ))}

      {/* Button skeletons */}
      {showButtons && (
        <div className="flex gap-7">
          <ButtonSkeleton />
          <ButtonSkeleton />
        </div>
      )}

      {/* Label pair skeletons */}
      {Array.from({ length: labelPairCount }).map((_, i) => (
        <div key={`label-pair-${i}`} className="flex gap-7">
          <LabelSkeleton />
          <LabelSkeleton />
        </div>
      ))}
    </div>
  )
}
