import Skeleton from '@/components/shared/skeleton/skeleton'

// Mirrors: 16px 110px 1fr 160px 220px 180px 240px (non-custom, non-selection view)
const GRID_COLS = '16px 110px 1fr 160px 220px 180px 240px'

const HeaderRow = () => (
  <div className="grid gap-x-3 px-3 py-2 border-b" style={{ gridTemplateColumns: GRID_COLS }}>
    <div />
    <Skeleton height={12} width={60} />
    <Skeleton height={12} width="60%" />
    <Skeleton height={12} width={60} />
    <Skeleton height={12} width={80} />
    <Skeleton height={12} width={70} />
    <Skeleton height={12} width={90} />
  </div>
)

const ControlRowSkeleton = () => (
  <div className="grid gap-x-3 px-3 py-2.5 items-center border-b last:border-b-0" style={{ gridTemplateColumns: GRID_COLS }}>
    <Skeleton height={12} width={12} />
    <Skeleton height={14} width={70} />
    <Skeleton height={14} width="70%" />
    <div className="flex items-center gap-1.5">
      <Skeleton height={20} width={20} className="rounded-full" />
      <Skeleton height={12} width={80} />
    </div>
    <div className="flex flex-col gap-1.5">
      <Skeleton height={6} width="100%" className="rounded-full" />
      <Skeleton height={18} width={90} className="rounded-full" />
    </div>
    <div className="flex flex-col gap-1.5">
      <Skeleton height={6} width="100%" className="rounded-full" />
      <Skeleton height={18} width={80} className="rounded-full" />
    </div>
    <div className="flex gap-1.5">
      <Skeleton height={18} width={55} className="rounded-full" />
      <Skeleton height={18} width={55} className="rounded-full" />
    </div>
  </div>
)

const CategoryGroupSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="rounded-lg border overflow-hidden">
    <div className="flex items-center gap-3 px-3 py-2.5 bg-background-secondary border-b">
      <Skeleton height={14} width={14} />
      <Skeleton height={14} width={120} />
      <Skeleton height={18} width={28} className="rounded-full ml-1" />
    </div>
    <HeaderRow />
    {Array.from({ length: rows }).map((_, i) => (
      <ControlRowSkeleton key={i} />
    ))}
  </div>
)

export const ControlReportPageSkeleton = () => {
  return (
    <div className="flex flex-col gap-3 mt-2">
      <CategoryGroupSkeleton rows={4} />
      <CategoryGroupSkeleton rows={3} />
      <CategoryGroupSkeleton rows={2} />
    </div>
  )
}
