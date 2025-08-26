import Skeleton from './skeleton'

type LabelSkeletonProps = {
  height?: number
  width?: number
}

export const LabelSkeleton = ({ height = 10, width = 100 }: LabelSkeletonProps) => {
  return <Skeleton height={height} width={width} />
}
