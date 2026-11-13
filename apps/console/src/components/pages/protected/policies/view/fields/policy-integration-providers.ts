import { type InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import { isSafeLinkHref, sanitizeHtml } from '@/lib/html/sanitize-html'
import { IntegrationDefinitionID } from '@/lib/enums/integration'

type PolicyIntegrationProvider = {
  definitionID: IntegrationDefinitionID
  buildSourceUrl: (policy: InternalPolicyByIdFragment) => string | null
}

const ONE_DRIVE_HOST = 'onedrive.live.com'
const SHAREPOINT_HOST_SUFFIX = '.sharepoint.com'
const IFRAME_SRC_PATTERN = /<iframe[^>]*\ssrc=["']([^"']+)["']/i
const IFRAME_ONLY_PATTERN = /^\s*<iframe[\s>]/i

const EMBED_SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['iframe'],
  ALLOWED_ATTR: ['src', 'width', 'height', 'frameborder', 'scrolling', 'allowfullscreen', 'allow', 'style', 'class'],
}

const isOneDriveUrl = (href: string): boolean => {
  try {
    const { protocol, hostname } = new URL(href)
    return protocol === 'https:' && (hostname === ONE_DRIVE_HOST || hostname.endsWith(SHAREPOINT_HOST_SUFFIX))
  } catch {
    return false
  }
}

const POLICY_INTEGRATION_PROVIDERS: PolicyIntegrationProvider[] = [
  {
    definitionID: IntegrationDefinitionID.GOOGLE_DRIVE,
    buildSourceUrl: (policy) => {
      if (!policy.externalFileID) {
        return null
      }
      const candidate = `https://docs.google.com/document/d/${policy.externalFileID}/edit`
      return isSafeLinkHref(candidate, 'https://docs.google.com') ? candidate : null
    },
  },
  {
    definitionID: IntegrationDefinitionID.ONE_DRIVE,
    buildSourceUrl: (policy) => (policy.url && isOneDriveUrl(policy.url) ? policy.url : null),
  },
]

export const resolvePolicyIntegrationProvider = (definitionID: string | null | undefined): PolicyIntegrationProvider | undefined =>
  definitionID ? POLICY_INTEGRATION_PROVIDERS.find((provider) => provider.definitionID === definitionID) : undefined

export const getPolicyDocumentEmbed = (policy: InternalPolicyByIdFragment): string | null => {
  const contents = policy.liveExternalContents
  if (!contents || (policy.sourceDefinitionID && policy.sourceDefinitionID !== IntegrationDefinitionID.ONE_DRIVE)) {
    return null
  }
  const src = contents.match(IFRAME_SRC_PATTERN)?.[1]
  return src && isOneDriveUrl(src) ? sanitizeHtml(contents, EMBED_SANITIZE_CONFIG) : null
}

export const isEmbedOnlyDocument = (contents: string): boolean => IFRAME_ONLY_PATTERN.test(contents)
