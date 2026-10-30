import Skeleton from '@/components/shared/skeleton/skeleton'
import { Card, CardContent } from '@repo/ui/cardpanel'

const PLACEHOLDER_COUNT = 3

export const CustomerLogosSkeleton = () => (
  <div role="status" aria-live="polite" aria-label="Loading customer logos" className="flex flex-col gap-6">
    {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
      <Card key={index} className="p-6">
        <CardContent className="p-0">
          <div className="flex gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-md" />
            <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
              <Skeleton height={14} className="w-full max-w-[160px] rounded-md" />
              <Skeleton height={12} className="w-full max-w-[220px] rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)
