'use client'

import Skeleton from '@/components/shared/skeleton/skeleton'

export const CoverageByTypeSkeleton = () => {
  return (
    <div className="rounded-2xl py-6">
      <Skeleton height={24} width={180} className="mb-6" />

      <div className="flex flex-wrap gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 w-full md:w-[calc(50%-1rem)]">
            <Skeleton height={16} width={96} />

            <Skeleton height={12} width="60%" className="rounded-md" />

            <Skeleton height={14} width={40} />
          </div>
        ))}
      </div>
    </div>
  )
}
