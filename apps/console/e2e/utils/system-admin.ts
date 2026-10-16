const FGA_URL = process.env.E2E_FGA_URL ?? 'http://localhost:8080'
const FGA_STORE_NAME = process.env.E2E_FGA_STORE ?? 'openlane'
const FGA_API_TOKEN = process.env.E2E_FGA_API_TOKEN

const SYSTEM_OBJECT = 'system:openlane_core'
const SYSTEM_ADMIN_RELATION = 'system_admin'

const fga = async <T>(method: 'GET' | 'POST', route: string, body?: object): Promise<T> => {
  const res = await fetch(`${FGA_URL}${route}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(FGA_API_TOKEN ? { authorization: `Bearer ${FGA_API_TOKEN}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10_000), // 10s
  })
  if (!res.ok) {
    throw new Error(`OpenFGA ${method} ${route} failed: ${res.status} ${await res.text()}`)
  }
  return (await res.json()) as T
}

const findStoreId = async (): Promise<string> => {
  const { stores } = await fga<{ stores: Array<{ id: string; name: string }> }>('GET', '/stores')
  const store = stores.find((s) => s.name === FGA_STORE_NAME)
  if (!store) {
    throw new Error(`OpenFGA at ${FGA_URL} has no store named "${FGA_STORE_NAME}" (found: ${stores.map((s) => s.name).join(', ') || 'none'})`)
  }
  return store.id
}

export const grantSystemAdmin = async (userId: string): Promise<void> => {
  const storeId = await findStoreId()
  const tupleKey = { user: `user:${userId}`, relation: SYSTEM_ADMIN_RELATION, object: SYSTEM_OBJECT }

  await fga('POST', `/stores/${storeId}/write`, { writes: { tuple_keys: [tupleKey], on_duplicate: 'ignore' } })
}
