import { ButtonSkeleton } from '@/components/shared/skeleton/button-skeleton'
import { LabelSkeleton } from '@/components/shared/skeleton/label-skeleton'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { TitleSkeleton } from '@/components/shared/skeleton/title-skeleton'

export const AssetsDetailsSheetSkeleton = () => {
  return (
    <div className="flex flex-col mt-2 gap-2">
      <div className="flex flex-col mb-1">
        <TitleSkeleton />
      </div>
      <Skeleton height={50} width={500} />
      <Skeleton height={50} width={200} />
      <Skeleton height={50} width={200} />
      <Skeleton height={50} width={200} />
      <div className="flex gap-7">
        <ButtonSkeleton />
        <ButtonSkeleton />
      </div>
      <div className="flex gap-7">
        <LabelSkeleton />
        <LabelSkeleton />
      </div>
      <div className="flex gap-7">
        <LabelSkeleton />
        <LabelSkeleton />
      </div>
      <div className="flex gap-7">
        <LabelSkeleton />
        <LabelSkeleton />
      </div>
      <div className="flex gap-7">
        <LabelSkeleton />
        <LabelSkeleton />
      </div>
      <div className="flex gap-7">
        <LabelSkeleton />
        <LabelSkeleton />
      </div>
      <div className="flex gap-7">
        <LabelSkeleton />
        <LabelSkeleton />
      </div>
      <div className="flex gap-7">
        <LabelSkeleton />
        <LabelSkeleton />
      </div>
    </div>
  )
}
