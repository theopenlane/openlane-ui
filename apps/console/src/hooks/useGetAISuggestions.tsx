import { ChatMessage } from '@repo/ui/components/editor/use-chat.js'
import { useState } from 'react'

// Define the shape of the context object passed to the AI suggestions API
export interface ContextType {
  background?: string
  organization?: OrganizationContext
  user?: UserContext
  control?: ControlContext
  policy?: PolicyContext
  conversationHistory?: ConversationMessage[]
  additionalContext?: string
}

export interface OrganizationContext {
  organizationName?: string | null
}

export interface UserContext {
  name?: string | null
}

export interface ControlContext {
  id?: string
  refCode: string
  title?: string | null
  framework?: string | null
  description?: string | null
}

export interface PolicyContext {
  name: string
  id?: string
  description?: string | null
}

export interface ConversationMessage {
  role: ChatMessage['role']
  content: string
}

function serializeContext(context?: ContextType): string {
  if (!context) return ''
  let out = 'Context:\n'
  if (context.background) out += `Background: ${context.background}\n`
  if (context.organization?.organizationName) out += `Organization: ${context.organization.organizationName}\n`
  if (context.user?.name) out += `User: ${context.user.name}\n`
  if (context.control) {
    out += `Control: ${context.control.refCode || ''} (${context.control.framework || ''}) - ${context.control.title || ''}\n`
    if (context.control.description) out += `Control Description: ${context.control.description}\n`
  }
  if (context.policy?.name) out += `Policy: ${context.policy.name}\n`
  if (context.policy?.description) out += `Policy Description: ${context.policy.description}\n`
  if (context.additionalContext) out += `Additional Context: ${JSON.stringify(context.additionalContext)}\n`
  if (context.conversationHistory && context.conversationHistory.length > 0) {
    out += `Conversation History:\n`
    for (const msg of context.conversationHistory) {
      out += `- ${msg.role}: ${msg.content}\n`
    }
  }
  return out
}

export function useAISuggestions() {
  const [suggestions, setSuggestions] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getAISuggestions = async (section: string, prompt: string, context?: ContextType, signal?: AbortSignal) => {
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
          context: serializeContext(context),
        }),
        signal,
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
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }
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
