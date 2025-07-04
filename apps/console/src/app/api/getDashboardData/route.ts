'use server'

import { sessionCookieName } from '@repo/dally/auth'

export interface OrganizationNode {
  id: string
  displayName: string
}

export interface OrganizationEdge {
  node: OrganizationNode
}

export interface OrganizationsData {
  organizations: {
    edges: OrganizationEdge[]
  }
}

export interface AuthExtension {
  authentication_type: 'jwt'
  authorized_organization: string[]
  refresh_token: string
  session_id: string
}

export interface Extensions {
  auth: AuthExtension
  server_latency: string
  trace_id: string
}

export interface DashboardErrorResponse {
  success: false
  error: string
}

export interface DashboardSuccessResponse {
  data: OrganizationsData
  extensions: Extensions
  success?: true
}

export type GetDashboardDataResponse = DashboardSuccessResponse | DashboardErrorResponse

const GetDashboardDataDocument = `
  query {
    organizations {
      edges {
        node {
          id
          displayName
        }
      }
    }
  }
`

export async function getDashboardData(accessToken: string, session: string): Promise<OrganizationsData | null> {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_API_GQL_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        Cookie: `${sessionCookieName}=${session}`,
      },
      body: JSON.stringify({
        query: GetDashboardDataDocument,
        variables: {},
      }),
    })

    const result: GetDashboardDataResponse = await response.json()

    if ('success' in result && result.success === false) {
      console.error('Dashboard fetch failed:', result.error)
      return null
    }

    if ('errors' in result) {
      console.error('GraphQL Errors:', result.errors)
      return null
    }

    return result.data ?? null
  } catch (error) {
    console.error('Network error fetching dashboard data:', error)
    return null
  }
}
