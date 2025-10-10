import { cn } from '@repo/ui/lib/utils'
import React from 'react'

export function Rectangle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'w-full h-[74px] flex-shrink-0 rounded-md',
        'dark:bg-[linear-gradient(180deg,rgba(22,36,49,0)_0%,#162431_100%)]',
        'bg-[linear-gradient(180deg,rgba(244,249,250,0)_0%,#F4F9FA_100%)]',
        className,
      )}
      {...props}
    />
  )
}
