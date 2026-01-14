import React, { useEffect, useState } from 'react'

import { Pencil, Trash2, InfoIcon, Save, ExternalLink, Copy } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import UrlInput from './url-input'
import { Label } from '@repo/ui/label'
import { useCreateCustomDomain, useDeleteCustomDomain } from '@/lib/graphql-hooks/trust-center'
import { useNotification } from '@/hooks/useNotification'
import { GetTrustCenterQuery } from '@repo/codegen/src/schema'
import { DnsRecordsSheet } from './dns-records-sheet'
import { SaveButton } from '@/components/shared/save-button/save-button'

type Props = {
  trustCenter: NonNullable<NonNullable<NonNullable<GetTrustCenterQuery['trustCenters']>['edges']>[number]> | undefined
}

const ConfigureUrlSection = ({ trustCenter }: Props) => {
  const { mutateAsync: createCustomDomain } = useCreateCustomDomain()
  const { successNotification, errorNotification } = useNotification()
  const [inputValue, setInputValue] = useState('')
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)

  const trustCenterDefaultDomain = trustCenter?.node?.slug ? `https://trust.theopenlane.net/${trustCenter?.node?.slug}` : ''
  const customDomain = trustCenter?.node?.customDomain?.cnameRecord
  const defaultDomain = customDomain ? `https://${customDomain}` : trustCenterDefaultDomain

  const { mutateAsync: deleteCustomDomain } = useDeleteCustomDomain()

  const handleCancel = () => {
    setEditing(false)
    setInputValue(trustCenter?.node?.customDomain?.cnameRecord || '')
  }

  const handleCreateCustomDomain = async () => {
    if (!trustCenter?.node?.id) return
    try {
      await createCustomDomain({
        input: {
          trustCenterID: trustCenter.node.id,
          cnameRecord: inputValue,
        },
      })

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

  const handleDeleteCustomDomain = async () => {
    try {
      await deleteCustomDomain({ deleteCustomDomainId: trustCenter?.node?.customDomain?.id || '' })
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

  const handleUpdateCustomDomain = async () => {
    try {
      if (!trustCenter?.node?.customDomain?.id || !trustCenter?.node?.id || !inputValue) {
        errorNotification({
          title: 'Update failed',
          description: 'No custom domain found to update.',
        })
        return
      }

      await deleteCustomDomain({ deleteCustomDomainId: trustCenter.node.customDomain.id })
      await createCustomDomain({
        input: {
          trustCenterID: trustCenter.node.id,
          cnameRecord: inputValue,
        },
      })

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

  useEffect(() => {
    setInputValue(trustCenter?.node?.customDomain?.cnameRecord || '')
    return () => {}
  }, [trustCenter])

  const renderContent = () => {
    if (!trustCenter?.node?.customDomain) {
      return (
        <div>
          <p className="text-base mb-2">Let&apos;s get you a home for your Trust Center. Start with a subdomain</p>
          <div className="flex gap-1 items-center">
            <p className="text-base">URL</p>
            <SystemTooltip icon={<InfoIcon className="text-brand-100" size={14} />} content={<p>Test123</p>} />
          </div>
          <div className="flex gap-3 items-center mt-2.5">
            <UrlInput value={inputValue} onChange={setInputValue} />
            <Button onClick={handleCreateCustomDomain} className="shrink-0">
              Set
            </Button>
          </div>
        </div>
      )
    }

    if (trustCenter.node.customDomain.cnameRecord) {
      return (
        <div className="space-y-6">
          {/* Custom Domain */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Label className="text-sm">Custom Domain</Label>
              <SystemTooltip icon={<InfoIcon className="text-brand-100" size={14} />} content={<p>Configure your own domain name for your Trust Center.</p>} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <UrlInput value={inputValue} onChange={setInputValue} disabled={!editing} verifiedStatus={trustCenter.node.customDomain.dnsVerification?.dnsVerificationStatus || null} />
              {editing ? (
                <div className="flex gap-2">
                  <SaveButton onClick={handleUpdateCustomDomain} className="gap-1 p-2" />
                  <Button onClick={handleCancel} className="gap-1 p-2" icon={<Save size={16} />} iconPosition="left">
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <Button className="gap-1 p-2" icon={<Pencil size={16} />} iconPosition="left" onClick={() => setEditing(true)}>
                    Edit
                  </Button>

                  <Button onClick={handleDeleteCustomDomain} variant="secondary" className="gap-1 p-2" icon={<Trash2 size={14} />} iconPosition="left">
                    Delete
                  </Button>
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-text-informational">Once your domain is set, you&apos;ll need to configure DNS records with your domain provider to complete the setup.</p>
            <Button variant="secondary" className="mt-3 gap-2 h-8" onClick={() => setOpen(true)}>
              Show DNS records
            </Button>
          </div>
        </div>
      )
    }
  }

  return (
    <>
      <div className="grid grid-cols-[250px_auto] gap-6 items-start border-b pb-8">
        <div>
          <h1 className="text-xl text-text-header font-medium">Configure URL</h1>
        </div>

        <div className="space-y-6">
          <div className="border rounded-md p-4 space-y-2 max-w-[730px]">
            <div className="flex items-start gap-2">
              <InfoIcon className="text-brand-100 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-medium ">Default domain availability</p>
                <p className="text-sm ">
                  Even if you set up a vanity domain, your default domain will remain accessible. Vanity domains let you host your Trust Center on your company&apos;s root domain—for example,
                  <span className="mx-1 font-medium text-text-header">trust.yourcompany.com</span>
                  instead of trust.theopenlane.net/yourcompany{' '}
                </p>
              </div>
            </div>
          </div>
          {trustCenter?.node?.slug && (
            <div>
              <Label className="text-sm">Default</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm">{defaultDomain}</span>
                <Button onClick={handleCopyDefaultDomain} variant="secondary" className="h-7 px-2 gap-1" icon={<Copy size={14} />} iconPosition="left">
                  Copy
                </Button>
                <a href={defaultDomain} rel={'noreferrer'} target="_blank">
                  <Button variant="secondary" className="h-7 px-2 gap-1" icon={<ExternalLink size={14} />} iconPosition="left">
                    Visit
                  </Button>
                </a>
              </div>
            </div>
          )}
          {renderContent()}
        </div>
      </div>
      <DnsRecordsSheet open={open} onOpenChange={setOpen} trustCenter={trustCenter} />
    </>
  )
}

export default ConfigureUrlSection
