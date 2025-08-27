import Skeleton from './skeleton'

type TitleSkeletonProps = {
  height?: number
  width?: number
}

export const TitleSkeleton = ({ height = 50, width = 700 }: TitleSkeletonProps) => {
  return <Skeleton height={height} width={width} />
}
