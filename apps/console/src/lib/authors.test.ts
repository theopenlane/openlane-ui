import { type ApiToken, type User } from '@repo/codegen/src/schema'
import { DELETED_USER_LABEL, resolveAuthor, resolveAuthorName, SUPPORT_DISPLAY_NAME, SUPPORT_SUBJECT_ID, UNKNOWN_AUTHOR_ID, UNKNOWN_AUTHOR_LABEL } from './authors'

const user = { id: '01HXAMPLEUSER0000000000000', displayName: 'Sarah Funkhouser' } as User
const token = { id: '01HXAMPLETOKEN000000000000', name: 'ci-token' } as ApiToken

const userMap = { [user.id]: user }
const tokenMap = { [token.id]: token }

describe('resolveAuthor', () => {
  it('resolves a user from the user map', () => {
    const author = resolveAuthor(user.id, { userMap, tokenMap })
    expect(author).toEqual({ kind: 'user', displayName: 'Sarah Funkhouser', user })
  })

  it('resolves the support subject id to Openlane Support', () => {
    const author = resolveAuthor(SUPPORT_SUBJECT_ID, { userMap, tokenMap })
    expect(author).toEqual({ kind: 'support', displayName: SUPPORT_DISPLAY_NAME })
  })

  it('prefers a matching user over the support identity', () => {
    const supportUser = { id: SUPPORT_SUBJECT_ID, displayName: 'Actual User' } as User
    const author = resolveAuthor(SUPPORT_SUBJECT_ID, { userMap: { [SUPPORT_SUBJECT_ID]: supportUser } })
    expect(author.kind).toBe('user')
  })

  it('resolves an api token by name', () => {
    const author = resolveAuthor(token.id, { userMap, tokenMap })
    expect(author).toEqual({ kind: 'token', displayName: 'ci-token', token })
  })

  it('resolves the backend unknown sentinel to an unknown author', () => {
    expect(resolveAuthor(UNKNOWN_AUTHOR_ID, { userMap, tokenMap })).toEqual({ kind: 'unknown', displayName: UNKNOWN_AUTHOR_LABEL })
  })

  it('falls back to deleted user for unknown and empty ids', () => {
    expect(resolveAuthor('01HXUNKNOWN000000000000000', { userMap, tokenMap })).toEqual({ kind: 'deleted', displayName: DELETED_USER_LABEL })
    expect(resolveAuthor('system', {})).toEqual({ kind: 'deleted', displayName: DELETED_USER_LABEL })
    expect(resolveAuthor(null)).toEqual({ kind: 'deleted', displayName: DELETED_USER_LABEL })
    expect(resolveAuthor(undefined)).toEqual({ kind: 'deleted', displayName: DELETED_USER_LABEL })
  })

  it('falls back to - for users without a display name', () => {
    const anon = { id: '01HXAMPLEANON0000000000000' } as User
    expect(resolveAuthorName(anon.id, { userMap: { [anon.id]: anon } })).toBe('-')
  })
})
