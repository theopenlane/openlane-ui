import { cn } from '@repo/ui/lib/utils'
import Skeleton from './skeleton'

type SkeletonRowsProps = {
  count: number
  height: string | number
  className?: string
}

export const SkeletonRows = ({ count, height, className }: SkeletonRowsProps) => (
  <>
    {Array.from({ length: count }, (_, index) => (
      <Skeleton key={index} height={height} className={cn('w-full rounded-lg', className)} />
    ))}
  </>
)
