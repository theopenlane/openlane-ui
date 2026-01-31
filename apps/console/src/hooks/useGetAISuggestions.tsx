import { useState } from 'react'

export function useAISuggestions() {
  const [suggestions, setSuggestions] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getAISuggestions = async (section: string, prompt: string, context?: string) => {
    setLoading(true)
    setActiveSection(section)
    setSuggestions('')
    setError(null)

    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          context, // Optional: pass form data, user info, etc.
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }

      // Read the streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        setSuggestions((prev) => prev + chunk)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error getting suggestions:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearSuggestions = () => {
    setSuggestions('')
    setActiveSection(null)
    setError(null)
  }

  return {
    suggestions,
    loading,
    activeSection,
    error,
    getAISuggestions,
    clearSuggestions,
  }
}
