import Skeleton from '@/components/shared/skeleton/skeleton'

export const TrustCenterSkeleton = () => {
  return (
    <div className="flex items-center justify-center mt-2 h-full">
      <div className="flex flex-col gap-3">
        <Skeleton height={300} width={700} />
        <Skeleton height={300} width={700} />
        <Skeleton height={300} width={700} />
      </div>
    </div>
  )
}
