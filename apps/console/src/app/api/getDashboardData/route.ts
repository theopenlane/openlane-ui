import 'server-only'
import { queryGraphqlServer } from '@/lib/server/fetch-graphql'

export interface OrganizationNode {
  id: string
  displayName: string
  personalOrg: boolean
}

export interface OrganizationEdge {
  node: OrganizationNode
}

export interface OrganizationsData {
  organizations: {
    edges: OrganizationEdge[]
  }
}

const GetDashboardDataDocument = `
  query {
    organizations {
      edges {
        node {
          id
          displayName
          personalOrg
        }
      }
    }
  }
`

export async function getDashboardData(accessToken: string, session: string): Promise<OrganizationsData | null> {
  return queryGraphqlServer<OrganizationsData>(GetDashboardDataDocument, {}, accessToken, session)
}
