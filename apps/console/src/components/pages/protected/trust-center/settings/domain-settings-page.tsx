'use client'

import Loading from '@/app/(protected)/trust-center/domain/loading'
import { useCreateCustomDomain, useDeleteCustomDomain, useGetTrustCenter, useValidateCustomDomain } from '@/lib/graphql-hooks/trust-center'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useContext, useEffect, useState } from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Label } from '@repo/ui/label'
import { Button } from '@repo/ui/button'
import { Copy, ExternalLink, InfoIcon, Pencil, Save, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import UrlInput from './url-input'
import { DnsRecords } from './dns-records'
import { PageHeading } from '@repo/ui/page-heading'
import { DnsVerificationDnsVerificationStatus } from '@repo/codegen/src/schema'

const DomainSettingsPage = () => {
  const { data, isLoading, error, refetch } = useGetTrustCenter()
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { successNotification, errorNotification } = useNotification()
  const [inputValue, setInputValue] = useState('')
  const [editing, setEditing] = useState(false)
  const [verificationCountDown, setVerificationCountDown] = useState(0)
  const { mutateAsync: deleteCustomDomain } = useDeleteCustomDomain()
  const { mutateAsync: createCustomDomain } = useCreateCustomDomain()
  const { mutateAsync: validateCustomDomain, isPending: isValidating } = useValidateCustomDomain()

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Domain', href: '/trust-center/domain' }])
  }, [setCrumbs])

  const trustCenter = data?.trustCenters?.edges?.[0]?.node
  const setting = trustCenter?.setting

  useEffect(() => {
    setInputValue(trustCenter?.customDomain?.cnameRecord || '')
    return () => {}
  }, [trustCenter])

  useEffect(() => {
    if (verificationCountDown <= 0) return
    const timer = setInterval(() => {
      setVerificationCountDown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [verificationCountDown])

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return <div className="p-6 text-red-600">Failed to load trust center settings: {error.message}</div>
  }

  if (!setting || !trustCenter) {
    return <div className="p-6">No trust center settings found.</div>
  }

  const dnsVerification = trustCenter?.customDomain?.dnsVerification
  const hasReason = typeof dnsVerification?.dnsVerificationStatusReason === 'string' && dnsVerification.dnsVerificationStatusReason.trim().length > 0

  const cnameRecord = trustCenter?.customDomain?.cnameRecord
  const cnameName = cnameRecord ? cnameRecord.split('.').slice(0, -2).join('.') : ''

  const handleCancel = () => {
    setEditing(false)
    setInputValue(trustCenter.customDomain?.cnameRecord || '')
  }

  const verify = async () => {
    if (!trustCenter?.customDomain?.id) return
    try {
      await validateCustomDomain({ validateCustomDomainId: trustCenter.customDomain.id })
      setVerificationCountDown(60)
      successNotification({
        title: 'Verification triggered',
        description: 'DNS verification has been initiated.',
      })
    } catch (err) {
      errorNotification({
        title: 'Verification failed',
        description: 'Could not trigger DNS verification. Please try again.',
      })
      console.error(err)
    }
  }

  const handleCreateCustomDomain = async () => {
    if (!trustCenter?.id) return
    try {
      await createCustomDomain({
        input: {
          trustCenterID: trustCenter.id,
          cnameRecord: inputValue,
        },
      })

      await refetch()

      successNotification({
        title: 'Custom domain set!',
        description: 'Your custom domain was successfully created.',
      })

      setEditing(false)
    } catch (err) {
      errorNotification({
        title: 'Creation failed',
        description: 'We could not create the custom domain. Please try again.',
      })
      console.error(err)
    }
  }

  const handleUpdateCustomDomain = async () => {
    try {
      if (!trustCenter?.customDomain?.id || !trustCenter?.id || !inputValue) {
        errorNotification({
          title: 'Update failed',
          description: 'No custom domain found to update.',
        })
        return
      }

      await deleteCustomDomain({ deleteCustomDomainId: trustCenter.customDomain.id })

      await createCustomDomain({
        input: {
          trustCenterID: trustCenter.id,
          cnameRecord: inputValue,
        },
      })

      await refetch()

      successNotification({
        title: 'Updated!',
        description: 'Your custom domain was successfully updated.',
      })

      setEditing(false)
    } catch (err) {
      errorNotification({
        title: 'Update failed',
        description: 'We could not update the custom domain. Please try again.',
      })
      console.error(err)
    }
  }
  const handleDeleteCustomDomain = async () => {
    try {
      await deleteCustomDomain({ deleteCustomDomainId: trustCenter?.customDomain?.id || '' })

      await refetch()

      successNotification({
        title: 'Deleted!',
        description: 'The custom domain was successfully removed.',
      })

      setInputValue('')
    } catch (err) {
      errorNotification({
        title: 'Delete failed',
        description: 'We could not delete the custom domain. Please try again.',
      })
      console.error(err)
    }
  }

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

  const handleCopyDefaultCname = () => {
    navigator.clipboard
      .writeText(trustCenter.customDomain?.cnameRecord || '')
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

  const trustCenterDefaultDomain = trustCenter?.slug ? `https://trust.theopenlane.net/${trustCenter?.slug}` : ''
  const defaultDomain = trustCenterDefaultDomain

  const renderContent = () => {
    if (!trustCenter?.customDomain) {
      return (
        <div className="flex w-full gap-2">
          <UrlInput value={inputValue} onChange={setInputValue} className="flex-1 h-10" />
          <Button onClick={handleCreateCustomDomain} variant="secondary" className="h-10 flex items-center justify-center gap-2 px-4" icon={<Save size={16} />} iconPosition="left">
            Set
          </Button>
        </div>
      )
    }

    if (trustCenter.customDomain?.cnameRecord) {
      return (
        <div className="flex w-full gap-2">
          <UrlInput value={inputValue} onChange={setInputValue} disabled={!editing} verifiedStatus={dnsVerification?.dnsVerificationStatus || null} className="flex-1 h-10" />
          {editing ? (
            <div className="flex gap-2">
              <Button onClick={handleUpdateCustomDomain} variant="secondary" className="h-10 flex items-center justify-center gap-2 px-4" icon={<Save size={16} />} iconPosition="left">
                Save
              </Button>
              <Button onClick={handleCancel} variant="secondary" className="h-10 flex items-center justify-center gap-2 px-4" icon={<Save size={16} />} iconPosition="left">
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" className="h-10 flex items-center justify-center gap-2 px-4" icon={<Pencil size={16} />} iconPosition="left" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button onClick={handleDeleteCustomDomain} variant="secondary" className="h-10 flex items-center justify-center" icon={<Trash2 size={14} />} iconPosition="center" />
              {dnsVerification?.dnsVerificationStatus && (
                <>
                  <Button onClick={handleCopyDefaultCname} variant="secondary" className="flex items-center justify-center h-10 gap-1" icon={<Copy size={14} />} iconPosition="left"></Button>
                  <a href={trustCenter.customDomain?.cnameRecord} rel={'noreferrer'} target="_blank">
                    <Button variant="secondary" className="flex items-center justify-center h-10 gap-1" icon={<ExternalLink size={14} />} iconPosition="left"></Button>
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      )
    }
  }

  return (
    <div className="w-full flex justify-center py-4">
      <div className="w-full max-w-[1200px] grid gap-6">
        <PageHeading heading="Domain settings" />
        <Card>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <p className="text-base font-medium leading-6">Configure URL</p>
                <p className="text-sm text-inverted-muted-foreground font-medium leading-6">
                  This is the link you&apos;ll send to customers so they can verify your security and compliance in real time
                </p>
              </div>
              <div>
                {trustCenter?.slug && (
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-3 border rounded-md justify-between py-2 px-3 w-full">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-inverted-muted-foreground font-medium leading-6">Default:</Label>
                        <span className="text-sm">{defaultDomain}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={handleCopyDefaultDomain} variant="secondary" className="flex items-center justify-center h-10 gap-1" icon={<Copy size={14} />} iconPosition="left"></Button>
                      <a href={defaultDomain} rel={'noreferrer'} target="_blank">
                        <Button variant="secondary" className="flex items-center justify-center h-10 gap-1" icon={<ExternalLink size={14} />} iconPosition="left"></Button>
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <div className="border border-document-draft-border bg-infobox rounded-md p-4 my-3">
                <div className="flex items-start gap-2">
                  <InfoIcon className="text-brand-100 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-sm">
                      Even if you set up a vanity domain, your default domain will remain accessible. Vanity domains let you host your Trust Center on your company&apos;s root domain—for example,
                      <span className="mx-1 font-medium text-text-header">trust.yourcompany.com</span>
                      instead of trust.theopenlane.net/yourcompany{' '}
                    </p>
                  </div>
                </div>
              </div>
              {dnsVerification?.dnsVerificationStatus === DnsVerificationDnsVerificationStatus.PENDING && hasReason && (
                <div className="border border-document-draft-border bg-infobox rounded-md p-4 my-1">
                  <div className="flex items-start gap-2">
                    <InfoIcon className="text-brand-100 shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-sm">{dnsVerification.dnsVerificationStatusReason}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3">
                <p className="text-base font-medium leading-6">Vanity Domain</p>
                {renderContent()}
                <p className="text-sm text-inverted-muted-foreground font-medium leading-6">
                  Once your domain is set, you&apos;ll need to configure DNS records with your domain provider to complete the setup.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {trustCenter.customDomain?.cnameRecord && <DnsRecords onVerify={verify} cnameName={cnameName} dnsVerification={dnsVerification} isVerifying={isValidating} countdown={verificationCountDown} />}
        <div className="grid gap-10 text-sm text-text-informational mt-6">
          <ul className="list-disc list-inside space-y-1">
            <li>DNS changes can take 2&ndash;72 minutes to propagate depending on your provider</li>
            <li>You can click Verify to manually trigger a check (this button becomes available every 60 seconds)</li>
            <li>We&apos;ll continue checking in the background and update the verification status automatically</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DomainSettingsPage
