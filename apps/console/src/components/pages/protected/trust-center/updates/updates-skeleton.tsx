import Skeleton from '@/components/shared/skeleton/skeleton'
import { Card, CardContent } from '@repo/ui/cardpanel'

const PLACEHOLDER_COUNT = 3

export const UpdatesSkeleton = () => (
  <div role="status" aria-live="polite" aria-label="Loading updates" className="space-y-4">
    {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
      <Card key={index}>
        <CardContent className="flex flex-col gap-2 p-4">
          <Skeleton height={14} className="w-full max-w-[200px] rounded-md" />
          <Skeleton height={12} className="w-full rounded-md" />
          <Skeleton height={12} className="w-full max-w-[70%] rounded-md" />
          <Skeleton height={12} className="mt-1 w-full max-w-[100px] rounded-md" />
        </CardContent>
      </Card>
    ))}
  </div>
)
