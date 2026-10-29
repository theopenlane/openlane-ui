import { UserFacingError } from '@/utils/graphQlErrorMatcher'

export class IncompleteImportError extends UserFacingError {
  name = 'IncompleteImportError'

  constructor(
    readonly title: string,
    message: string,
  ) {
    super(message)
  }
}
