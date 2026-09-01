import { type User } from '@repo/codegen/src/schema'

// Must match the backend SupportAccessConfig.SubjectID (theopenlane/core), the stable subject id
// used for created_by/updated_by attribution during Openlane support impersonation sessions
export const SUPPORT_SUBJECT_ID = process.env.NEXT_PUBLIC_SUPPORT_SUBJECT_ID || '01JSPPRT000000000000000000'
export const SUPPORT_DISPLAY_NAME = 'Openlane Support'
export const INTEGRATION_SUBJECT_ID = process.env.NEXT_PUBLIC_INTEGRATION_SUBJECT_ID || '01JNTGACTR0000000000000000'
export const INTEGRATION_DISPLAY_NAME = 'Openlane Integrations'
export const DELETED_USER_LABEL = 'Deleted user'

export const UNKNOWN_AUTHOR_ID = 'unknown'
export const UNKNOWN_AUTHOR_LABEL = 'Unknown'
export const EMPTY_DISPLAY_NAME = '-'

export type AuthorToken = { id: string; name: string }

export type AuthorMaps = {
  userMap?: Record<string, User>
  tokenMap?: Record<string, AuthorToken>
}

export type ResolvedAuthor =
  | { kind: 'user'; displayName: string; user: User }
  | { kind: 'support'; displayName: string }
  | { kind: 'integration'; displayName: string }
  | { kind: 'token'; displayName: string; token: AuthorToken }
  | { kind: 'unknown'; displayName: string }
  | { kind: 'deleted'; displayName: string }

export function resolveAuthor(id: string | null | undefined, { userMap, tokenMap }: AuthorMaps = {}): ResolvedAuthor {
  if (!id) return { kind: 'deleted', displayName: DELETED_USER_LABEL }
  if (id === UNKNOWN_AUTHOR_ID) return { kind: 'unknown', displayName: UNKNOWN_AUTHOR_LABEL }
  const user = userMap?.[id]
  if (user) return { kind: 'user', displayName: user.displayName || EMPTY_DISPLAY_NAME, user }
  if (id === SUPPORT_SUBJECT_ID) return { kind: 'support', displayName: SUPPORT_DISPLAY_NAME }
  if (id === INTEGRATION_SUBJECT_ID) return { kind: 'integration', displayName: INTEGRATION_DISPLAY_NAME }
  const token = tokenMap?.[id]
  if (token) return { kind: 'token', displayName: token.name, token }
  return { kind: 'deleted', displayName: DELETED_USER_LABEL }
}

export const resolveAuthorName = (id: string | null | undefined, maps: AuthorMaps = {}): string => resolveAuthor(id, maps).displayName
