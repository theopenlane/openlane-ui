'use client'

import Skeleton from '@/components/shared/skeleton/skeleton'

export const RecentActivitySkeleton = () => {
  return (
    <div className="rounded-2xl flex-1">
      <Skeleton height={24} width={160} className="mb-7" />

      <ul className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex justify-between items-center border-b pb-2 last:border-b-0">
            <div className="flex items-center gap-3">
              <Skeleton height={32} width={32} className="rounded-full" />

              <div className="flex flex-col gap-1">
                <Skeleton height={14} width={180} />
                <Skeleton height={12} width={120} />
              </div>
            </div>

            <Skeleton height={12} width={80} />
          </li>
        ))}
      </ul>
    </div>
  )
}
