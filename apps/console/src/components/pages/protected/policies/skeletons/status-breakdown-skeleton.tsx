'use client'

import Skeleton from '@/components/shared/skeleton/skeleton'

export const StatusBreakdownSkeleton = () => {
  return (
    <div className="flex flex-col">
      <Skeleton height={24} width={180} className="mb-7" />

      <div className="flex gap-5 rounded-2xl w-full lg:w-1/3">
        <div className="flex items-center justify-center">
          <Skeleton height={66} width={66} className="rounded-full" />
        </div>

        <ul className="space-y-4 w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Skeleton height={16} width={16} className="rounded-full" />
                <Skeleton height={16} width={80} />
              </div>
              <Skeleton height={28} width={28} className="rounded-full" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
