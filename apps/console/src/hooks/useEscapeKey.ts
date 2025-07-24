import { useEffect } from 'react'

type UseEscapeKeyOptions = {
  enabled?: boolean
}

const useEscapeKey = (callback: () => void, options?: UseEscapeKeyOptions) => {
  const { enabled = true } = options || {}

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [callback, enabled])
}

export default useEscapeKey
