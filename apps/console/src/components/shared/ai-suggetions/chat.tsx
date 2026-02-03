import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Check, Copy, Sparkles } from 'lucide-react'
import { Textarea } from '@repo/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { ControlContext, OrganizationContext, ConversationMessage, useAISuggestions, UserContext, PolicyContext } from '@/hooks/useGetAISuggestions.tsx'
import ReactMarkdown from 'react-markdown'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  providedContext: {
    organization?: OrganizationContext
    user?: UserContext
    background?: string
    control?: ControlContext
    policy?: PolicyContext
    conversationHistory?: ConversationMessage[]
  }
  // contextKey is a unique identifier for the context, used for storing chat history - usually an id or unique ref code
  contextKey: string
  // object is the object the chat is about, e.g., a control or policy and a human readable name which could be a name, ref code, etc.
  object: {
    type: string
    name: string
  }
}

const MAX_CHAT_HISTORY = 10
const CHAT_STORAGE_KEY_PREFIX = 'chat-history'

const AIChat: React.FC<AIChatProps> = ({ open, onOpenChange, providedContext, contextKey, object }) => {
  const [aiPrompt, setAiPrompt] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isCopied, setIsCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { suggestions, loading: suggestionsLoading, getAISuggestions } = useAISuggestions()
  const abortControllerRef = useRef<AbortController | null>(null)

  const chatStorageKey = `${CHAT_STORAGE_KEY_PREFIX}-${contextKey}`

  useEffect(() => {
    try {
      const stored = localStorage.getItem(chatStorageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        const history = parsed.map((msg: ChatMessage) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
        setChatHistory(history)
      }
    } catch (error) {
      console.error('Failed to load chat history from localStorage', error)
    }
  }, [chatStorageKey])

  useEffect(() => {
    if (chatHistory.length > 0) {
      try {
        const trimmedHistory = chatHistory.slice(-MAX_CHAT_HISTORY)
        localStorage.setItem(chatStorageKey, JSON.stringify(trimmedHistory))
      } catch (error) {
        console.error('Failed to save chat history to localStorage', error)
      }
    }
  }, [chatHistory, chatStorageKey])

  useEffect(() => {
    if (!suggestionsLoading && suggestions) {
      try {
        const response = suggestions ? JSON.parse(suggestions) : null
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response ? response.text : 'No response received',
          timestamp: new Date(),
        }
        setChatHistory((prev) => [...prev, assistantMessage])
      } catch {
        setChatHistory((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: suggestions,
            timestamp: new Date(),
          },
        ])
      }
    }
  }, [suggestionsLoading, suggestions])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatHistory])

  const handleAskAI = async () => {
    if (!aiPrompt.trim()) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: aiPrompt,
      timestamp: new Date(),
    }
    setChatHistory((prev) => [...prev, userMessage])
    setAiPrompt('')

    abortControllerRef.current = new AbortController()

    getAISuggestions(
      object.type,
      aiPrompt,
      {
        ...providedContext,
        conversationHistory: [
          ...(providedContext.conversationHistory || []),
          ...chatHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
      },
      abortControllerRef.current.signal,
    )
  }

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      console.error('Failed to copy message to clipboard')
    }
  }

  const handleCloseAIDialog = () => {
    onOpenChange(false)
    setAiPrompt('')
    setIsCopied(false)
  }

  const handleClearChat = () => {
    setChatHistory([])
    localStorage.removeItem(chatStorageKey)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAskAI()
    }
  }

  const handleCancelAI = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl min-h-[200px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={20} />
            Ask Lane about this {object.type}
          </DialogTitle>
          <div className="text-xs text-muted-foreground pl-7 pb-1">Lane helps you navigate trust and compliance</div>
        </DialogHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto pr-4">
          <div className="space-y-4 py-4">
            {chatHistory.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Sparkles size={20} className="mx-auto mb-2 opacity-50 text-sm" />
                <p className="text-sm">
                  Start a conversation by asking a question about this {object.type}: {object.name}
                </p>
              </div>
            ) : (
              chatHistory.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user' ? 'bg-primary text-chat-user-text' : 'bg-muted text-chat-assistant-text'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 whitespace-pre-wrap break-words text-sm">
                        {message.role === 'assistant' ? (
                          <>
                            <span className="font-semibold mr-2">Lane:</span>
                            <ReactMarkdown
                              components={{
                                p: ({ ...props }) => <span {...props} />,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </>
                        ) : (
                          <>
                            {providedContext.user?.name && <span className="font-semibold mr-2">{providedContext.user.name}:</span>}
                            {message.content}
                          </>
                        )}
                      </div>
                      {message.role === 'assistant' && (
                        <Button type="button" variant="outline" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => handleCopyMessage(message.content)}>
                          {isCopied ? <Check size={14} /> : <Copy size={14} />}
                        </Button>
                      )}
                    </div>
                    <div className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</div>
                  </div>
                </div>
              ))
            )}
            {suggestionsLoading && (
              <div className="flex gap-3 justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="animate-pulse">Thinking...</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <Textarea
            placeholder="Ask a question... (Press Enter to send, Shift+Enter for new line)"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="w-full resize-none"
            disabled={suggestionsLoading}
          />
          <div className="flex justify-between items-center">
            <Button type="button" variant="outline" onClick={handleCloseAIDialog}>
              Close
            </Button>
            <div className="flex gap-2">
              {chatHistory.length > 0 && (
                <Button type="button" variant="outline" onClick={handleClearChat}>
                  Clear Chat
                </Button>
              )}
              {suggestionsLoading ? (
                <Button type="button" variant="destructive" onClick={handleCancelAI}>
                  Cancel
                </Button>
              ) : (
                <Button type="button" variant="primary" onClick={handleAskAI} disabled={!aiPrompt.trim()}>
                  Send
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AIChat
