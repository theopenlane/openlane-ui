import type { Metadata } from 'next'
import { GET_CAMPAIGN_BY_ID_MINIFIED } from '@repo/codegen/query/campaign'
import type { GetCampaignByIdMinifiedQuery, GetCampaignByIdMinifiedQueryVariables } from '@repo/codegen/src/schema'
import { buildDetailMetadata } from '@/lib/server/build-detail-metadata'

export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> => {
  const { id } = await params
  return buildDetailMetadata<GetCampaignByIdMinifiedQueryVariables, GetCampaignByIdMinifiedQuery>({
    query: GET_CAMPAIGN_BY_ID_MINIFIED,
    variables: { campaignId: id },
    prefix: 'Campaign',
    selectLabel: (data) => data.campaign?.name,
  })
}

const CampaignIdLayout = ({ children }: { children: React.ReactNode }) => <>{children}</>

export default CampaignIdLayout
