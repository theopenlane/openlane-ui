'use client'

import React from 'react'
import { KeyRound } from 'lucide-react'
import { Logo } from '@repo/ui/logo'
import { cn } from '@repo/ui/lib/utils'
import { Avatar } from '@/components/shared/avatar/avatar'
import { type AuthorMaps, type ResolvedAuthor, resolveAuthor } from '@/lib/authors'

type AuthorDisplayProps = {
  author: ResolvedAuthor
  showAvatar?: boolean
  className?: string
  avatarClassName?: string
}

export const AuthorDisplay: React.FC<AuthorDisplayProps> = ({ author, showAvatar = true, className, avatarClassName }) => {
  const content = (() => {
    switch (author.kind) {
      case 'user':
        return showAvatar && <Avatar entity={author.user} className={cn('h-6 w-6', avatarClassName)} />
      case 'support':
        return (
          showAvatar && (
            <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-card', avatarClassName)}>
              <Logo asIcon width={14} />
            </span>
          )
        )
      case 'token':
        return (
          showAvatar && (
            <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center', avatarClassName)}>
              <KeyRound size={16} />
            </span>
          )
        )
      case 'deleted':
        return null
    }
  })()

  return (
    <span className={cn('flex items-center gap-1 text-sm', author.kind === 'deleted' && 'text-muted-foreground italic', className)}>
      {content}
      {author.displayName}
    </span>
  )
}

type AuthorCellProps = AuthorMaps & {
  id?: string | null
  showAvatar?: boolean
  className?: string
  avatarClassName?: string
  emptyLabel?: string
}

export const AuthorCell: React.FC<AuthorCellProps> = ({ id, userMap, tokenMap, showAvatar, className, avatarClassName, emptyLabel }) => {
  if (!id && emptyLabel !== undefined) return <span className={cn('text-muted-foreground', className)}>{emptyLabel}</span>
  return <AuthorDisplay author={resolveAuthor(id, { userMap, tokenMap })} showAvatar={showAvatar} className={className} avatarClassName={avatarClassName} />
}
