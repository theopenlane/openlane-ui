import Skeleton from '@/components/shared/skeleton/skeleton'
import { Card } from '@repo/ui/cardpanel'

export const EvidenceSkeleton = () => (
  <div className="flex flex-col gap-7">
    <Card className="p-6">
      <div className="flex flex-col gap-5 p-5">
        <div className="flex justify-between">
          <Skeleton height={20} width={200} />
          <Skeleton height={20} width={50} />
        </div>
        <div className="flex gap-10 items-center justify-between">
          <Skeleton height={100} width={100} className="rounded-full" />
          <div className="flex flex-col gap-1 items-center">
            <Skeleton height={20} width={50} />
            <Skeleton height={20} width={100} />
          </div>
          <div className="flex flex-col gap-1 items-center">
            <Skeleton height={20} width={50} />
            <Skeleton height={20} width={100} />
          </div>
          <div className="flex flex-col gap-1 items-center">
            <Skeleton height={20} width={50} />
            <Skeleton height={20} width={100} />
          </div>
          <div className="flex flex-col gap-1 items-center">
            <Skeleton height={20} width={50} />
            <Skeleton height={20} width={100} />
          </div>
          <div className="flex flex-col gap-1 items-center">
            <Skeleton height={20} width={50} />
            <Skeleton height={20} width={100} />
          </div>
        </div>
      </div>
    </Card>
  </div>
)
