import { CAPTURE_SOURCE_NAME, connectResponseSchema, EVIDENCE_EXTENSION_ID, type TConnectMessage, type TConnectResponse } from '@repo/evidence-capture/connect'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'

export const EVIDENCE_EXTENSION_ENABLED = process.env.NEXT_PUBLIC_EVIDENCE_EXTENSION_ENABLED === 'true'

type TExtensionRuntime = NonNullable<NonNullable<Window['chrome']>['runtime']>

export const isEvidenceExtensionReachable = () => typeof window !== 'undefined' && !!window.chrome?.runtime?.sendMessage

const readConnectResponse = (runtime: TExtensionRuntime, response: unknown): TConnectResponse => {
  if (runtime.lastError) {
    return { ok: false, error: runtime.lastError.message ?? 'The extension is not installed.' }
  }
  const parsed = connectResponseSchema.safeParse(response)
  return parsed.success ? parsed.data : { ok: false, error: 'The extension did not respond.' }
}

export const sendConnectionToEvidenceExtension = (message: TConnectMessage) =>
  new Promise<string | undefined>((resolve, reject) => {
    const runtime = window.chrome?.runtime
    if (!runtime) {
      reject(new UserFacingError(`The ${CAPTURE_SOURCE_NAME} extension is not available in this browser.`))
      return
    }
    runtime.sendMessage(EVIDENCE_EXTENSION_ID, message, (response) => {
      const result = readConnectResponse(runtime, response)
      if (!result.ok) {
        reject(new UserFacingError(`The extension could not be connected: ${result.error}`))
        return
      }
      resolve(result.replacedTokenId)
    })
  })
