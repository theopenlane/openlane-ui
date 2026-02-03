import { Sparkles, Copy, Check, X, PlusCircle } from 'lucide-react'
import { useState } from 'react'

interface AISuggestionsPanelProps {
  suggestions: { text: string }
  loading?: boolean
  onDismiss?: () => void
  onInsert?: (text: string) => void
  variant?: 'inline' | 'popup'
}

export function AISuggestionsPanel({ suggestions, loading = false, onDismiss, onInsert, variant = 'inline' }: AISuggestionsPanelProps) {
  const [copied, setCopied] = useState(false)
  const [inserted, setInserted] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(suggestions.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInsert = () => {
    if (onInsert) {
      onInsert(suggestions.text)
      setInserted(true)
      setTimeout(() => setInserted(false), 2000)
    }
  }

  if (!suggestions && !loading) return null

  const containerClass = variant === 'popup' ? 'bg-purple-900/20 border border-purple-700/50 rounded-lg p-4' : 'mt-4 pt-4 border-t border-gray-700'

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400" />
          <span className="text-sm font-medium opacity-70">{loading ? 'Generating suggestions...' : 'AI Suggestions'}</span>
        </div>

        <div className="flex items-center gap-2">
          {suggestions.text && !loading && (
            <>
              {/* Insert Button */}
              {onInsert && (
                <button type="button" onClick={handleInsert} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 px-2 py-1 rounded font-medium">
                  {inserted ? (
                    <>
                      <Check size={14} />
                      Inserted
                    </>
                  ) : (
                    <>
                      <PlusCircle size={14} />
                      Insert
                    </>
                  )}
                </button>
              )}

              {/* Copy Button */}
              <button type="button" onClick={handleCopy} className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1 px-2 py-1 rounded">
                {copied ? (
                  <>
                    <Check size={14} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </button>
            </>
          )}

          {onDismiss && (
            <button type="button" onClick={onDismiss} className="text-xs text-gray-400 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-700">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="text-sm whitespace-pre-wrap bg-secondary rounded p-3 max-h-64 overflow-y-auto">
        {loading && !suggestions.text ? (
          <div className="flex items-center gap-2">
            <div className="animate-pulse opacity-70">encrypting brilliance... stand by</div>
          </div>
        ) : (
          suggestions.text
        )}
      </div>
    </div>
  )
}
