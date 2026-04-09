import React from 'react'
import Skeleton from '@/components/shared/skeleton/skeleton'

export const NotificationsSkeleton = () => {
  return (
    <div className="max-w-250 mx-auto w-full px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton height={32} width={180} />
        <Skeleton height={36} width={160} />
      </div>

      <div className="flex gap-8 items-start">
        <div className="w-44 shrink-0 flex flex-col gap-1">
          <Skeleton height={12} width={60} className="mb-2" />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} height={32} />
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-6">
          {['Today', 'Earlier'].map((group) => (
            <div key={group} className="flex flex-col gap-1">
              <Skeleton height={12} width={56} className="mb-2" />
              {Array.from({ length: group === 'Today' ? 3 : 2 }).map((_, i) => (
                <Skeleton key={i} height={56} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
