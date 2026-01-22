'use client'
import { useGetTrustCenter, useGetTrustCenterDocs, useGetTrustCenterLastUpdated, useGetTrustCenterPosts } from '@/lib/graphql-hooks/trust-center'
import { formatDate } from '@/utils/date'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { PageHeading } from '@repo/ui/page-heading'
import { Brush, Globe, Megaphone, Server, Upload } from 'lucide-react'
import { LivePreview, LivePreviewTrustCenter } from './live-preview'
import { useGetTrustCenterSubprocessors } from '@/lib/graphql-hooks/trust-center-subprocessors'
import { useRouter } from 'next/navigation'
import { SuggestedActionCard } from './suggested-action-card'
import { useContext, useEffect } from 'react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const OverviewPage: React.FC = () => {
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { data: trustCenterData } = useGetTrustCenter()

  const { trustCenterSubprocessors, isLoading: isLoadingSubprocessors } = useGetTrustCenterSubprocessors({})
  const { docs, isLoading: isLoadingDocs } = useGetTrustCenterDocs({})
  const router = useRouter()
  const trustCenterID = trustCenterData?.trustCenters?.edges?.[0]?.node?.id ?? ''
  const trustCenter = trustCenterData?.trustCenters?.edges?.[0]?.node
  const { data: lastUpdatedData } = useGetTrustCenterLastUpdated({ trustCenterId: trustCenterID, enabled: !trustCenterID })

  const updatedAtValues: string[] = [
    lastUpdatedData?.trustCenter.customDomain?.updatedAt,
    lastUpdatedData?.trustCenter.setting?.updatedAt,

    ...(lastUpdatedData?.trustCenter.trustCenterCompliances?.edges ?? []).map((e) => e?.node?.updatedAt),
    ...(lastUpdatedData?.trustCenter.trustCenterSubprocessors?.edges ?? []).map((e) => e?.node?.updatedAt),
    ...(lastUpdatedData?.trustCenter.trustCenterEntities?.edges ?? []).map((e) => e?.node?.updatedAt),
    ...(lastUpdatedData?.trustCenter.trustCenterDocs?.edges ?? []).map((e) => e?.node?.updatedAt),
    ...(lastUpdatedData?.trustCenter.posts?.edges ?? []).map((e) => e?.node?.updatedAt),
  ].filter(Boolean)

  const mostRecentUpdatedAt = updatedAtValues.length > 0 ? new Date(Math.max(...updatedAtValues.map((d) => new Date(d).getTime()))).toISOString() : null

  const trustCenterLivePreview: LivePreviewTrustCenter | undefined = trustCenter
    ? {
        customDomain: {
          cnameRecord: (trustCenter.customDomain?.cnameRecord ?? trustCenter?.slug) ? `https://trust.theopenlane.net/${trustCenter?.slug}` : '',
        },
        updatedAt: mostRecentUpdatedAt ?? new Date(0).toISOString(),
      }
    : undefined

  const { data: postsData } = useGetTrustCenterPosts({ trustCenterId: trustCenterID })
  const posts = postsData?.trustCenter?.posts?.edges ?? []

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Overview', href: '/trust-center/overview' }])
  }, [setCrumbs])

  const handleRouting = (route: string) => {
    router.push(`/trust-center/${route}`)
  }

  return (
    <div className="w-full flex justify-center py-4">
      <div className="w-full max-w-[1232px] grid gap-6">
        <PageHeading heading="Overview" />
        <div className="flex gap-3">
          <div className="flex flex-col gap-3 basis-[65%]">
            <div className="flex-1">
              {posts.length === 0 ? (
                <div className="inset-0 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-8">
                  <Megaphone size={24} className="mb-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium mb-1 text-foreground">No updates posted yet</h3>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col gap-2">
                    <p className="text-xl font-medium leading-7">Latest Updates</p>
                    {posts.slice(-3).map((edge) => {
                      const post = edge?.node
                      if (!post) return null

                      return (
                        <div key={post.id} className="flex flex-col gap-1 py-1">
                          <p className="text-sm text-text-paragraph font-medium leading-6">{post.title || 'No title'}</p>
                          <p className="text-sm text-trust-center-text font-normal leading-5">{post.text}</p>
                          <p className="text-xs text-trust-center-created-at">{formatDate(post.updatedAt)}</p>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </div>

            <Card>
              <CardContent className="flex flex-col gap-2">
                <p className="text-xl font-medium leading-7">Suggested Actions</p>
                <div className="flex flex-row gap-3 flex-wrap">
                  {!trustCenter?.customDomain && (
                    <SuggestedActionCard
                      handleRouting={handleRouting}
                      icon={Globe}
                      description="Make your trust center available at a branded URL for customers and auditors."
                      route="domain"
                    ></SuggestedActionCard>
                  )}
                  {!trustCenter?.setting?.logoFile ||
                    (!trustCenter?.setting?.faviconFile && (
                      <SuggestedActionCard handleRouting={handleRouting} icon={Brush} description="Add your logo and favicon to personalize your trust center." route="branding"></SuggestedActionCard>
                    ))}
                  {!isLoadingSubprocessors && !trustCenterSubprocessors && (
                    <SuggestedActionCard
                      handleRouting={handleRouting}
                      icon={Server}
                      description="Maintain an up-to-date list of third-party services that process customer data."
                      route="subprocessors"
                    ></SuggestedActionCard>
                  )}
                  {!isLoadingDocs && docs.length === 0 && (
                    <SuggestedActionCard
                      handleRouting={handleRouting}
                      icon={Upload}
                      description="Upload policies, reports, and certifications to share your security posture."
                      route="documents"
                    ></SuggestedActionCard>
                  )}
                  <SuggestedActionCard
                    handleRouting={handleRouting}
                    icon={Megaphone}
                    description="Share updates, announcements, or important security notices with visitors."
                    route="updates"
                  ></SuggestedActionCard>
                </div>
              </CardContent>
            </Card>
          </div>

          {trustCenterLivePreview && (
            <div className="basis-[35%]">
              <LivePreview trustCenter={trustCenterLivePreview} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OverviewPage
