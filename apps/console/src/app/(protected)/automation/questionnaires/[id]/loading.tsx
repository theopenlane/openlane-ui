import Skeleton from '@/components/shared/skeleton/skeleton'
import React from 'react'

const Loader: React.FC = () => {
  return (
    <div className="space-y-6">
      <Skeleton className="rounded-lg" height={32} width={200} />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="rounded-lg" height={120} />
        <Skeleton className="rounded-lg" height={120} />
        <Skeleton className="rounded-lg" height={120} />
      </div>
      <Skeleton className="rounded-lg" height={200} />
      <Skeleton className="rounded-lg" height={400} />
    </div>
  )
}

export default Loader
