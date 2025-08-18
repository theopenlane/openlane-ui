import Skeleton from '@/components/shared/skeleton/skeleton'

export const ProgramsPageSkeleton = () => {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex gap-7 w-full">
        <div className="flex-1">
          <Skeleton height={560} />
        </div>
        <div className="flex flex-col gap-7 flex-1">
          <Skeleton height={270} />
          <Skeleton height={270} />
        </div>
      </div>
      <div className="flex gap-8 justify-center">
        <Skeleton height={170} className="flex-1" />
        <Skeleton height={170} className="flex-1" />
        <Skeleton height={170} className="flex-1" />
      </div>
      <Skeleton height={500} />
      <Skeleton height={240} />
    </div>
  )
}
