import { useEffect, useState } from 'react'

type UseFetchNextPageOnVisibleArgs = {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  fetchNextPage: () => unknown
}

export const useFetchNextPageOnVisible = ({ hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage }: UseFetchNextPageOnVisibleArgs) => {
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!sentinel || !hasNextPage || isFetchingNextPage || isFetchNextPageError) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage()
      },
      { rootMargin: '200px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [sentinel, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])

  return setSentinel
}
