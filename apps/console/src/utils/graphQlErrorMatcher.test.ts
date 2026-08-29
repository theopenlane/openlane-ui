import { ClientError } from 'graphql-request'
import { GraphQlResponseError } from '@/constants/graphQlResponseError'
import { isNonRetryableGraphQlError } from './graphQlErrorMatcher'

/**
 * react-query was retrying 400s and GRAPHQL_VALIDATION_FAILED, hammering the backend before surfacing an
 * error the user could do nothing about. Returning false means "retry", so both rules fail in the dangerous
 * direction.
 */

const clientError = (status: number, errors?: unknown[]): ClientError => new ClientError({ status, errors, data: undefined, headers: new Headers() } as never, { query: 'query {}' } as never)

const gqlErrors = (...codes: (string | undefined)[]) => codes.map((code) => ({ message: 'boom', extensions: code ? { code } : {}, path: [] }))

describe('HTTP status handling', () => {
  test.each([400, 401, 403, 404, 409, 422])('treats %s as non-retryable', (status) => {
    expect(isNonRetryableGraphQlError(clientError(status))).toBe(true)
  })

  test.each([408, 425, 429])('still retries %s, which is transient', (status) => {
    expect(isNonRetryableGraphQlError(clientError(status))).toBe(false)
  })

  test.each([500, 502, 503])('still retries server error %s', (status) => {
    expect(isNonRetryableGraphQlError(clientError(status))).toBe(false)
  })
})

describe('GraphQL error codes', () => {
  test('is non-retryable when every error carries a permanent code', () => {
    const error = clientError(200, gqlErrors(GraphQlResponseError.GraphQlValidationFailedCode))

    expect(isNonRetryableGraphQlError(error)).toBe(true)
  })

  test.each([
    GraphQlResponseError.NotFoundErrorCode,
    GraphQlResponseError.ValidationErrorCode,
    GraphQlResponseError.ConflictErrorCode,
    GraphQlResponseError.UnauthorizedErrorCode,
    GraphQlResponseError.AlreadyExistsErrorCode,
    GraphQlResponseError.BadRequestErrorCode,
    GraphQlResponseError.NoAccessToModuleErrorCode,
    GraphQlResponseError.GraphQlParseFailedCode,
  ])('treats %s as permanent', (code) => {
    expect(isNonRetryableGraphQlError(clientError(200, gqlErrors(code)))).toBe(true)
  })

  test('retries when ANY error in the payload is not a known permanent code', () => {
    // A mixed payload may still contain something transient.
    const error = clientError(200, gqlErrors(GraphQlResponseError.NotFoundErrorCode, 'INTERNAL_SERVER_ERROR'))

    expect(isNonRetryableGraphQlError(error)).toBe(false)
  })

  test('retries when an error carries no code at all', () => {
    expect(isNonRetryableGraphQlError(clientError(200, gqlErrors(undefined)))).toBe(false)
  })

  test('retries an empty error payload', () => {
    expect(isNonRetryableGraphQlError(clientError(200, []))).toBe(false)
  })

  test('reads a bare array of GraphQL errors, not just a ClientError', () => {
    expect(isNonRetryableGraphQlError(gqlErrors(GraphQlResponseError.ValidationErrorCode))).toBe(true)
  })
})

describe('unrecognised inputs stay retryable', () => {
  test.each([
    ['null', null],
    ['undefined', undefined],
    ['a plain Error', new Error('network down')],
    ['a string', 'boom'],
    ['an empty object', {}],
  ])('retries %s', (_label, error) => {
    // Defaulting to "retry" is the safe direction for an error shape we do not recognise — a transient
    // network failure must not be treated as permanent.
    expect(isNonRetryableGraphQlError(error)).toBe(false)
  })
})
