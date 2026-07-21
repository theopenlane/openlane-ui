'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Check, Sparkles, X } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import Menu from '@/components/shared/menu/menu'
import { useOnboardingChecklist } from '@/hooks/useOnboardingChecklist'
import { formatDate, isPastDate } from '@/utils/date'

// sessionStorage (not a ref) survives remounts of the sidebar during ordinary navigation,
// so the checklist only auto-opens once per browser session
const AUTO_OPEN_SESSION_KEY = 'onboarding-checklist-auto-opened'

const OnboardingChecklistWidget = ({ expanded }: { expanded: boolean }) => {
  const pathname = usePathname()
  const { suggestions, completedKeys, hasStoredProgress, toggleComplete } = useOnboardingChecklist()
  const [autoOpen, setAutoOpen] = useState(false)

  const total = suggestions.length
  const completed = suggestions.filter((suggestion) => completedKeys.includes(suggestion.key)).length

  useEffect(() => {
    if (typeof window === 'undefined' || sessionStorage.getItem(AUTO_OPEN_SESSION_KEY)) return
    if (pathname !== '/dashboard' || !hasStoredProgress || total === 0 || completed >= total) return
    sessionStorage.setItem(AUTO_OPEN_SESSION_KEY, 'true')
    setAutoOpen(true)
  }, [pathname, hasStoredProgress, total, completed])

  if (total === 0 || !hasStoredProgress) {
    return null
  }

  const percent = Math.round((completed / total) * 100)

  const content = (close: () => void) => (
    <div className="w-72 relative">
      <button type="button" onClick={close} aria-label="Close" className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
        <X size={14} />
      </button>
      <div className="flex items-center gap-2 pr-5">
        <Check size={16} className="text-success" />
        <span className="text-sm font-semibold">Get started</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {completed} of {total} completed
      </p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-gradient-to-r from-success to-info transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {suggestions.map((suggestion) => {
          const isDone = completedKeys.includes(suggestion.key)
          const isDisabled = !!suggestion.disabled
          return (
            <div key={suggestion.key} className={`flex items-start gap-2 ${isDisabled ? 'opacity-50' : ''}`}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleComplete(suggestion.key)
                }}
                disabled={isDisabled}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${isDone ? 'border-success bg-success/20' : 'border-border hover:border-success'} ${isDisabled ? 'cursor-not-allowed' : ''}`}
                aria-label={isDone ? `Mark ${suggestion.title} as not complete` : `Mark ${suggestion.title} as complete`}
              >
                {isDone && <Check size={10} className="text-success" />}
              </button>
              <button type="button" onClick={suggestion.onClick} disabled={isDisabled} className={`flex-1 text-left ${isDisabled ? 'cursor-not-allowed' : ''}`}>
                <span className="flex items-center gap-1.5">
                  <p className={`text-xs font-medium ${isDone ? 'text-muted-foreground line-through' : 'text-text-paragraph'}`}>{suggestion.title}</p>
                  {isDisabled && suggestion.disabledReason && (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {suggestion.disabledReason}
                    </Badge>
                  )}
                  {!isDone && suggestion.dueDate && (
                    <Badge variant={isPastDate(suggestion.dueDate) ? 'destructive' : 'blue'} className="shrink-0 text-[10px]">
                      Due: {formatDate(suggestion.dueDate)}
                    </Badge>
                  )}
                </span>
                <p className="text-[11px] text-muted-foreground">{suggestion.description}</p>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )

  const trigger = expanded ? (
    <button type="button" className="mx-2 flex w-[calc(100%-16px)] flex-col gap-1.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-card">
      <span className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-success" />
          Get Started
        </span>
        <span className="text-xs">
          {completed}/{total}
        </span>
      </span>
      <span className="block h-1 w-full overflow-hidden rounded-full bg-border">
        <span className="block h-full rounded-full bg-gradient-to-r from-success to-info" style={{ width: `${percent}%` }} />
      </span>
    </button>
  ) : (
    <button type="button" className="btn-card bg-transparent p-1 text-muted-foreground hover:text-foreground" aria-label="Onboarding checklist">
      <Sparkles size={20} className="text-success" />
    </button>
  )

  return <Menu trigger={trigger} content={content} side="right" align="start" defaultOpen={autoOpen} closeOnSelect />
}

export default OnboardingChecklistWidget
