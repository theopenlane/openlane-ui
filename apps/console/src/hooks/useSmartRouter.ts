import { useRouter } from 'next/navigation'

export const useSmartRouter = () => {
  const { replace: nextReplace } = useRouter()

  const replace = (newParams: Record<string, string | number | null>) => {
    const params = new URLSearchParams(window.location.search)

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        params.delete(key)
      } else {
        params.set(key, value.toString())
      }
    })

    nextReplace(`?${params.toString()}`)
  }

  return {
    replace,
  }
}
