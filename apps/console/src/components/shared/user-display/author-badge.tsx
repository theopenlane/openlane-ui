'use client'

import React from 'react'
import { type ApiToken, type User } from '@repo/codegen/src/schema'
import { KeyRound } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'

type AuthorBadgeProps = {
  user?: User
  token?: ApiToken
  fallback?: string
  className?: string
}

export const AuthorBadge: React.FC<AuthorBadgeProps> = ({ user, token, fallback = 'Deleted user', className }) => {
  if (token) {
    return (
      <span className={className ?? 'flex items-center gap-1 text-sm'}>
        <KeyRound size={14} /> {token.name}
      </span>
    )
  }
  if (user) {
    return (
      <span className={className ?? 'flex items-center gap-1 text-sm'}>
        <Avatar entity={user} variant="small" /> {user.displayName ?? '—'}
      </span>
    )
  }
  return <span className={className ?? 'text-sm'}>{fallback}</span>
}

export default AuthorBadge
