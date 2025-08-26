import Skeleton from './skeleton'

export const TableSkeleton = () => {
  return (
    <div className="flex flex-col mt-2 gap-2">
      <Skeleton height={50} />
      <Skeleton height={667} />
      <Skeleton height={25} />
    </div>
  )
}
