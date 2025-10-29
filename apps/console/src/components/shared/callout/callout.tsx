// components/Callout.tsx
import * as React from 'react'
import { Info, AlertTriangle, AlertCircle, CheckCircle2, LightbulbIcon } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'

type Variant = 'info' | 'success' | 'warning' | 'danger' | 'suggestion'

const variantToVars: Record<Variant, { bg: string; border: string; icon: string; iconEl: React.ElementType; link: string }> = {
  info: {
    bg: 'bg-[var(--color-info)]/10 dark:bg-[var(--color-info)]/18',
    border: 'border-[var(--color-info)]/60',
    icon: 'text-[var(--color-info)]',
    iconEl: Info,
    link: '[&_a]:text-[hsl(var(--foreground))] [&_a]:decoration-[var(--color-info)]',
  },
  success: {
    bg: 'bg-[var(--color-success)]/10 dark:bg-[var(--color-success)]/18',
    border: 'border-[var(--color-success)]/60',
    icon: 'text-[var(--color-success)]',
    iconEl: CheckCircle2,
    link: '[&_a]:text-[hsl(var(--foreground))] [&_a]:decoration-[var(--color-success)]',
  },
  warning: {
    bg: 'bg-[var(--color-warning)]/10 dark:bg-[var(--color-warning)]/18',
    border: 'border-[var(--color-warning)]/60',
    icon: 'text-[var(--color-warning)]',
    iconEl: AlertTriangle,
    link: '[&_a]:text-[hsl(var(--foreground))] [&_a]:decoration-[var(--color-warning)]',
  },
  suggestion: {
    bg: 'bg-[var(--color-suggestion)]/10 dark:bg-[var(--color-suggestion)]/18',
    border: 'border-[var(--color-suggestion)]/60',
    icon: 'text-[var(--color-suggestion)]',
    iconEl: LightbulbIcon,
    link: '[&_a]:text-[hsl(var(--foreground))] [&_a]:decoration-[var(--color-suggestion)]',
  },
  danger: {
    bg: 'bg-[var(--color-danger)]/10 dark:bg-[var(--color-danger)]/18',
    border: 'border-[var(--color-danger)]/60',
    icon: 'text-[var(--color-danger)]',
    iconEl: AlertCircle,
    link: '[&_a]:text-[hsl(var(--foreground))] [&_a]:decoration-[var(--color-danger)]',
  },
}

export interface CalloutProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: Variant
  title?: React.ReactNode
  compact?: boolean
  icon?: React.ReactNode // optional override
  link?: string
}

export function Callout({ variant = 'info', title, compact, icon, className, children, ...props }: CalloutProps) {
  const v = variantToVars[variant]
  const Icon = v.iconEl

  return (
    <div className={cn('rounded-lg border p-4', compact ? 'py-3' : 'pb-5', v.bg, v.border, className)} {...props}>
      <div className="flex gap-3">
        <div className={cn('mt-[2px] shrink-0', v.icon)}>{icon ?? <Icon className="h-5 w-5 opacity-90" aria-hidden />}</div>
        <div className="min-w-0">
          {title && <div className="mb-1 font-medium">{title}</div>}
          <div
            className={cn(
              'text-sm leading-relaxed ' +
                '[&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-2 ' +
                '[&_a]:hover:decoration-4 ' +
                '[&_a]:focus:outline-none [&_a]:focus:ring-2 [&_a]:focus:ring-offset-2 ' +
                '[&_a]:focus:ring-[var(--color-info)] dark:[&_a]:focus:ring-[var(--color-info)]',
              v.link,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
