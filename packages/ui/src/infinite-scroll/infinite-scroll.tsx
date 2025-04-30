import React, { useEffect, useRef } from 'react'
import { TPagination, TPaginationMeta } from '../pagination/types.ts'

type TInfiniteScrollProps = {
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  paginationMeta: TPaginationMeta
  children: React.ReactNode
  pageSize?: number
  rootMargin?: string
}

const InfiniteScroll = ({ pagination, onPaginationChange, paginationMeta, children, pageSize = 30, rootMargin = '100px' }: TInfiniteScrollProps) => {
  const loaderRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && paginationMeta?.pageInfo?.hasNextPage && !paginationMeta.isLoading) {
          const nextPagination: TPagination = {
            ...pagination,
            query: {
              first: pageSize,
              after: paginationMeta.pageInfo.endCursor ?? null,
            },
            page: pagination.page + 1,
          }
          onPaginationChange(nextPagination)
        }
      },
      { rootMargin },
    )

    const el = loaderRef.current
    if (el) {
      observer.observe(el)
    }

    return () => {
      if (el) {
        observer.unobserve(el)
      }
    }
  }, [pagination, paginationMeta, onPaginationChange, pageSize, rootMargin])

  return (
    <>
      {children}
      <div ref={loaderRef} className="w-full flex justify-center py-4">
        {paginationMeta.isLoading && <p>Loading...</p>}
      </div>
    </>
  )
}

export default InfiniteScroll
