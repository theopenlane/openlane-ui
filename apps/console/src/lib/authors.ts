import { type User } from '@repo/codegen/src/schema'

// Must match the backend SupportAccessConfig.SubjectID (theopenlane/core), the stable subject id
// used for created_by/updated_by attribution during Openlane support impersonation sessions
export const SUPPORT_SUBJECT_ID = process.env.NEXT_PUBLIC_SUPPORT_SUBJECT_ID || '01JSPPRT000000000000000000'
export const SUPPORT_DISPLAY_NAME = 'Openlane Support'
export const DELETED_USER_LABEL = 'Deleted user'

export type AuthorToken = { id: string; name: string }

export type AuthorMaps = {
  userMap?: Record<string, User>
  tokenMap?: Record<string, AuthorToken>
}

export type ResolvedAuthor =
  | { kind: 'user'; displayName: string; user: User }
  | { kind: 'support'; displayName: string }
  | { kind: 'token'; displayName: string; token: AuthorToken }
  | { kind: 'deleted'; displayName: string }

export function resolveAuthor(id: string | null | undefined, { userMap, tokenMap }: AuthorMaps = {}): ResolvedAuthor {
  if (!id) return { kind: 'deleted', displayName: DELETED_USER_LABEL }
  const user = userMap?.[id]
  if (user) return { kind: 'user', displayName: user.displayName || '-', user }
  if (id === SUPPORT_SUBJECT_ID) return { kind: 'support', displayName: SUPPORT_DISPLAY_NAME }
  const token = tokenMap?.[id]
  if (token) return { kind: 'token', displayName: token.name, token }
  return { kind: 'deleted', displayName: DELETED_USER_LABEL }
}

export const resolveAuthorName = (id: string | null | undefined, maps: AuthorMaps = {}): string => resolveAuthor(id, maps).displayName
