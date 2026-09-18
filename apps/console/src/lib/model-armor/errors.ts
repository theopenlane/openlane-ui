export class ModelArmorError extends Error {}

export class ModelArmorBlockedError extends ModelArmorError {
  readonly reasons: string[]

  constructor(reasons: string[]) {
    super(`prompt blocked by model armor: ${reasons.join(', ')}`)
    this.name = 'ModelArmorBlockedError'
    this.reasons = reasons
  }
}

export class ModelArmorUnavailableError extends ModelArmorError {
  constructor(detail: string) {
    super(`model armor could not screen the prompt: ${detail}`)
    this.name = 'ModelArmorUnavailableError'
  }
}

export const MODEL_ARMOR_BLOCKED_MESSAGE = 'This request was blocked by content safety filters. Please rephrase it and try again.'
export const MODEL_ARMOR_UNAVAILABLE_MESSAGE = 'Content safety screening is temporarily unavailable, so this request was not sent. Please try again shortly.'

export type ModelArmorOutcome = { message: string; status: number }

const unwrap = (err: unknown): unknown => (err instanceof ModelArmorError ? err : err instanceof Error && err.cause ? unwrap(err.cause) : err)

export const modelArmorOutcome = (err: unknown): ModelArmorOutcome | null => {
  const cause = unwrap(err)

  if (cause instanceof ModelArmorBlockedError) {
    console.warn(cause.message)
    return { message: MODEL_ARMOR_BLOCKED_MESSAGE, status: 422 }
  }

  if (cause instanceof ModelArmorUnavailableError) {
    console.error(cause.message)
    return { message: MODEL_ARMOR_UNAVAILABLE_MESSAGE, status: 503 }
  }

  return null
}
