'use client'

import Loading from '@/app/(protected)/trust-center/domain/loading'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useContext, useEffect } from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Label } from '@repo/ui/label'
import { Button } from '@repo/ui/button'
import { Copy, ExternalLink, InfoIcon } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'

const DomainSettingsPage = () => {
  const { data, isLoading, error } = useGetTrustCenter()
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { successNotification, errorNotification } = useNotification()

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Domain', href: '/trust-center/domain' }])
  }, [setCrumbs])

  const handleCopyDefaultDomain = () => {
    navigator.clipboard
      .writeText(defaultDomain)
      .then(() => {
        successNotification({
          title: 'Copied!',
        })
      })
      .catch(() => {
        errorNotification({
          title: 'Copy failed',
        })
      })
  }

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return <div className="p-6 text-red-600">Failed to load trust center settings: {error.message}</div>
  }

  const trustCenter = data?.trustCenters?.edges?.[0]?.node
  const setting = trustCenter?.setting

  if (!setting || !trustCenter) {
    return <div className="p-6">No trust center settings found.</div>
  }

  const trustCenterDefaultDomain = trustCenter?.slug ? `https://trust.theopenlane.net/${trustCenter?.slug}` : ''
  const customDomain = trustCenter?.customDomain?.cnameRecord
  const defaultDomain = customDomain ? `https://${customDomain}` : trustCenterDefaultDomain

  return (
    <div className="p-6 grid min-w-[832px] gap-6">
      <Card>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col">
              <p className="text-base font-medium leading-6">Default Domain</p>
              <p className="text-sm text-inverted-muted-foreground font-medium leading-6">This is the description text for this section.</p>
            </div>
            <div>
              {trustCenter?.slug && (
                <div className="flex items-center gap-3 border rounded-md justify-between py-2 px-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-inverted-muted-foreground font-medium leading-6">Default:</Label>
                    <span className="text-sm">{defaultDomain}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleCopyDefaultDomain} variant="secondary" className="h-7 px-2 gap-1" icon={<Copy size={14} />} iconPosition="left"></Button>
                    <a href={defaultDomain} rel={'noreferrer'} target="_blank">
                      <Button variant="secondary" className="h-7 px-2 gap-1" icon={<ExternalLink size={14} />} iconPosition="left"></Button>
                    </a>
                  </div>
                </div>
              )}
            </div>
            <div className="border border-document-draft-border bg-info rounded-md p-4 my-5 max-w-[730px]">
              <div className="flex items-start gap-2">
                <InfoIcon className="text-brand-100 shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-sm ">
                    Even if you set up a vanity domain, your default domain will remain accessible. Vanity domains let you host your Trust Center on your company&apos;s root domain—for example,
                    <span className="mx-1 font-medium text-text-header">trust.yourcompany.com</span>
                    instead of trust.theopenlane.net/yourcompany{' '}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-base font-medium leading-6">Vanity Domain</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <p>sdfds</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <p>sdfds</p>
        </CardContent>
      </Card>
      {/* <ConfigureUrlSection trustCenter={data.trustCenters.edges?.[0] || undefined} /> */}
    </div>
  )
}

export default DomainSettingsPage
