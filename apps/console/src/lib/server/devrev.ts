import 'server-only'
import { z } from 'zod'

const DEVREV_API_URL = 'https://api.devrev.ai'
const DEVREV_REQUEST_TIMEOUT_MS = 10_000 // 10s
const DEVREV_ORG_ID_FIELD = 'tnt__orgid'
const DEVREV_TENANT_SCHEMA_SPEC = { tenant_fragment: true }

const accountSchema = z.object({
  id: z.string(),
  external_refs: z.array(z.string()).nullish(),
  custom_fields: z.object({ [DEVREV_ORG_ID_FIELD]: z.string().nullish() }).nullish(),
})

const accountListSchema = z.object({ accounts: z.array(z.object({}).passthrough()) })
const authTokenSchema = z.object({ access_token: z.string() })
const devRevErrorSchema = z.object({ message: z.string().optional(), type: z.string().optional() })
const ignoredResponseSchema = z.object({})

type TDevRevAccount = z.infer<typeof accountSchema>

type TDevRevCredential = 'DEVREV_AAT' | 'DEVREV_API_TOKEN'

type TDevRevOrganization = {
  id: string
  name: string
}

type TDevRevUser = {
  id: string
  email?: string | null
  displayName?: string | null
}

export class DevRevError extends Error {}

class DevRevRequestError extends DevRevError {
  constructor(
    readonly endpoint: string,
    readonly status: number,
    readonly devRevMessage?: string,
  ) {
    super(`DevRev ${endpoint} failed with ${status}${devRevMessage ? `: ${devRevMessage}` : ''}`)
  }
}

const accountDisplayName = (organization: TDevRevOrganization) => `${organization.name} - ${organization.id}`

const readCredential = (credential: TDevRevCredential) => {
  const value = process.env[credential]
  if (!value) {
    throw new DevRevError(`${credential} is not configured`)
  }
  return value
}

const devRevRequest = async <T>(endpoint: string, credential: TDevRevCredential, body: object, schema: z.ZodType<T>): Promise<T> => {
  const response = await fetch(`${DEVREV_API_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${readCredential(credential)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(DEVREV_REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    const error = devRevErrorSchema.safeParse(await response.json().catch(() => ({})))
    throw new DevRevRequestError(endpoint, response.status, error.success ? (error.data.message ?? error.data.type) : undefined)
  }

  return schema.parse(await response.json())
}

const listAccounts = async (externalRefs: string[]): Promise<TDevRevAccount[]> => {
  const { accounts } = await devRevRequest('accounts.list', 'DEVREV_API_TOKEN', { external_refs: externalRefs, limit: 50 }, accountListSchema)

  return accounts.flatMap((account) => {
    const parsed = accountSchema.safeParse(account)
    return parsed.success ? [parsed.data] : []
  })
}

const hasExternalRef = (account: TDevRevAccount, externalRef: string) => account.external_refs?.includes(externalRef) ?? false

const isTaggedWith = (account: TDevRevAccount, organization: TDevRevOrganization) => account.custom_fields?.[DEVREV_ORG_ID_FIELD] === organization.id

const findOrganizationAccount = (accounts: TDevRevAccount[], organization: TDevRevOrganization) => {
  const account = accounts.find((candidate) => hasExternalRef(candidate, organization.id))
  if (account && !isTaggedWith(account, organization)) {
    throw new DevRevError(`DevRev account ${account.id} holds external ref ${organization.id} but is not tagged with that organization`)
  }
  return account
}

const adoptLegacyAccount = (account: TDevRevAccount, organization: TDevRevOrganization) =>
  devRevRequest(
    'accounts.update',
    'DEVREV_API_TOKEN',
    {
      id: account.id,
      display_name: accountDisplayName(organization),
      external_refs: [...(account.external_refs ?? []), organization.id],
    },
    ignoredResponseSchema,
  )

const createAccount = async (organization: TDevRevOrganization) => {
  try {
    await devRevRequest(
      'accounts.create',
      'DEVREV_API_TOKEN',
      {
        display_name: accountDisplayName(organization),
        external_refs: [organization.id],
        custom_fields: { [DEVREV_ORG_ID_FIELD]: organization.id },
        custom_schema_spec: DEVREV_TENANT_SCHEMA_SPEC,
      },
      ignoredResponseSchema,
    )
  } catch (error) {
    const createdConcurrently = error instanceof DevRevRequestError && error.status === 409 && !!findOrganizationAccount(await listAccounts([organization.id]), organization)
    if (!createdConcurrently) {
      throw error
    }
  }
}

export const ensureDevRevAccount = async (organization: TDevRevOrganization) => {
  const accounts = await listAccounts([organization.id, organization.name])

  if (findOrganizationAccount(accounts, organization)) {
    return
  }

  const legacyAccount = accounts.find((account) => hasExternalRef(account, organization.name) && isTaggedWith(account, organization))
  if (legacyAccount) {
    await adoptLegacyAccount(legacyAccount, organization)
    return
  }

  await createAccount(organization)
}

export const createDevRevSessionToken = async (organization: TDevRevOrganization, user: TDevRevUser) => {
  const { access_token } = await devRevRequest(
    'auth-tokens.create',
    'DEVREV_AAT',
    {
      rev_info: {
        user_ref: user.id,
        account_ref: organization.id,
        user_traits: {
          email: user.email,
          display_name: user.displayName,
        },
      },
    },
    authTokenSchema,
  )

  return access_token
}
