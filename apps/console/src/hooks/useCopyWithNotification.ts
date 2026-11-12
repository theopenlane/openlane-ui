import { useCallback } from 'react'
import { useNotification } from '@/hooks/useNotification'

export const useCopyWithNotification = () => {
  const { successNotification, errorNotification } = useNotification()

  return useCallback(
    async (value: string, label: string) => {
      try {
        await navigator.clipboard.writeText(value)
        successNotification({ title: 'Copied', description: `${label} copied to clipboard.` })
      } catch {
        errorNotification({ title: 'Copy failed', description: 'Clipboard access is not available in this context.' })
      }
    },
    [successNotification, errorNotification],
  )
}
