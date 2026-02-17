import Skeleton from '@/components/shared/skeleton/skeleton'
import { Card } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'

const ProgramCardSkeleton = () => (
  <Card className="p-6 gap-6 flex flex-col">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Skeleton width={30} height={30} className="rounded-full" />
        <Skeleton width={180} height={16} />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton width={32} height={32} />
        <Skeleton width={24} height={24} />
      </div>
    </div>

    <div className="flex items-center gap-3">
      <Skeleton width={14} height={14} className="rounded-full" />
      <Skeleton width={80} height={14} />
      <Skeleton width={4} height={4} className="rounded-full" />
      <Skeleton width={14} height={14} />
      <Skeleton width={140} height={14} />
      <Skeleton width={4} height={4} className="rounded-full" />
      <Skeleton width={14} height={14} />
      <Skeleton width={80} height={14} />
    </div>

    <div className="flex items-center">
      <div className="flex flex-col gap-1 w-[156px]">
        <Skeleton width={60} height={10} />
        <div className="flex gap-2 items-center">
          <Skeleton width={30} height={18} />
          <Skeleton width={60} height={12} />
        </div>
      </div>
      <Separator vertical className="mx-4 w-fit" separatorClass="h-10" />
      <div className="flex flex-col gap-1 w-[156px]">
        <Skeleton width={40} height={10} />
        <div className="flex gap-2 items-center">
          <Skeleton width={20} height={18} />
          <Skeleton width={30} height={12} />
        </div>
      </div>
      <Separator vertical className="mx-4 w-fit" separatorClass="h-10" />
      <div className="flex flex-col gap-1 w-[156px]">
        <Skeleton width={70} height={10} />
        <div className="flex gap-2 items-center">
          <Skeleton width={20} height={18} />
          <Skeleton width={30} height={12} />
        </div>
      </div>
    </div>

    <Skeleton height={36} className="rounded-md" />
  </Card>
)

export const ProgramsDashboardSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="flex justify-between items-center gap-4 flex-wrap">
      <div className="flex items-center gap-6">
        <Skeleton width={140} height={28} />
        <div className="flex items-center gap-2">
          <Skeleton width={36} height={20} className="rounded-full" />
          <Skeleton width={70} height={14} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton width={200} height={36} className="rounded-md" />
        <Skeleton width={220} height={36} className="rounded-md" />
        <Skeleton width={100} height={36} className="rounded-md" />
      </div>
    </div>

    {Array.from({ length: 2 }).map((_, groupIndex) => (
      <div key={groupIndex} className={groupIndex > 0 ? 'pt-8' : 'pb-0'}>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton width={20} height={20} />
          <Skeleton width={120} height={18} />
        </div>
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: groupIndex === 0 ? 3 : 2 }).map((_, cardIndex) => (
            <ProgramCardSkeleton key={cardIndex} />
          ))}
        </div>
      </div>
    ))}
  </div>
)
