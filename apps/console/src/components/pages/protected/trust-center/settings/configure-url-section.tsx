import React, { useState } from 'react'

import { Pencil, Trash2, InfoIcon, Save, ExternalLink, Copy } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Badge } from '@repo/ui/badge'
import UrlInput from './url-input'
import { Label } from '@repo/ui/label'
import { TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'

type Props = {
  setting: TrustCenterSetting
}

const ConfigureUrlSection = ({ setting }: Props) => {
  const [starterSubdomain, setStarterSubdomain] = useState('')
  const [primaryUrl, setPrimaryUrl] = useState('trustcenter.equinix.com')
  const [primaryEditing, setPrimaryEditing] = useState(false)
  const [secondaryUrl, setSecondaryUrl] = useState('trustcenter.ai')
  const [secondaryEditing, setSecondaryEditing] = useState(false)
  return (
    <>
      <div className="grid grid-cols-[250px_auto] gap-6 items-start border-b pb-8">
        <div>
          <h1 className="text-xl text-text-header font-medium">Configure URL</h1>
          <p className="text-base text-red-400">note: URL not set</p>
        </div>

        <div>
          <p className="text-base mb-2">Let&apos;s get you a home for your Trust Center. Start with a subdomain</p>
          <div className="flex gap-1 items-center">
            <p className="text-base">URL</p>
            <SystemTooltip icon={<InfoIcon className="text-brand-100" size={14} />} content={<p>Test123</p>} />
          </div>
          <div className="flex gap-3 items-center mt-2.5">
            <UrlInput value={starterSubdomain} onChange={setStarterSubdomain} />
            <Button className="shrink-0">Set</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[250px_auto] gap-6 items-start border-b pb-8">
        <div>
          <h1 className="text-xl text-text-header font-medium">Configure URL</h1>
          <Badge variant={'outline'} className="rounded-md my-2.5">
            <div className="h-2 w-2 rounded bg-brand mr-1"></div>
            <span className="font-normal">Verified</span>
          </Badge>
          <p className="text-base text-red-400">note: URL set</p>
        </div>

        <div>
          <div className="flex gap-1 items-center mb-2">
            <p className="text-base">URL</p>
            <SystemTooltip icon={<InfoIcon className="text-brand-100" size={14} />} content={<p>Test123</p>} />
          </div>

          <div className="flex items-center gap-2 mt-2.5">
            <UrlInput value={primaryUrl} onChange={setPrimaryUrl} disabled={!primaryEditing} />
            {primaryEditing ? (
              <Button className="gap-1  p-2" icon={<Save size={16} />} iconPosition="left" onClick={() => setPrimaryEditing(false)}>
                Save
              </Button>
            ) : (
              <>
                <Button className="gap-1 p-2" icon={<Pencil size={16} />} iconPosition="left" onClick={() => setPrimaryEditing(true)}>
                  Edit
                </Button>
                <Button variant="outline" className="gap-1  p-2" icon={<Trash2 size={16} />} iconPosition="left">
                  Delete
                </Button>
              </>
            )}
          </div>

          <p className="mt-2 text-xs text-text-informational">Once URL is set, you need to configure your DNS records</p>
          <Button variant="outline" className="mt-3 gap-2 h-8">
            <span className="font-normal">Show DNS records & verification status</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[250px_auto] gap-6 items-start border-b pb-8">
        <div>
          <h1 className="text-xl text-text-header font-medium">Configure URL</h1>
          <Badge variant={'outline'} className="rounded-md my-2.5">
            <div className="h-2 w-2 rounded bg-warning mr-1"></div>
            <span className="font-normal">Waiting</span>
          </Badge>
          <p className="text-base text-red-400">note: URL edit</p>
        </div>

        <div>
          <div className="flex gap-1 items-center mb-2">
            <p className="text-base">URL</p>
            <SystemTooltip icon={<InfoIcon className="text-brand-100" size={14} />} content={<p>Test123</p>} />
          </div>

          <div className="flex items-center gap-2 mt-2.5">
            <UrlInput value={secondaryUrl} onChange={setSecondaryUrl} disabled={!secondaryEditing} />
            {secondaryEditing ? (
              <Button className="gap-1 p-2" icon={<Save size={16} />} iconPosition="left" onClick={() => setSecondaryEditing(false)}>
                Save
              </Button>
            ) : (
              <>
                <Button className="gap-1 p-2" icon={<Pencil size={16} />} iconPosition="left" onClick={() => setSecondaryEditing(true)}>
                  Edit
                </Button>
                <Button variant="outline" className="gap-1  p-2" icon={<Trash2 size={16} />} iconPosition="left">
                  Delete
                </Button>
              </>
            )}
          </div>

          <p className="mt-2 text-xs text-text-informational">Once URL is set, you need to configure your DNS records</p>
          <Button variant="outline" className="mt-3 gap-2 h-8">
            <span className="font-normal">Show DNS records & verification status</span>
          </Button>
        </div>
      </div>
      <ConfigureDomainSection />
    </>
  )
}

export default ConfigureUrlSection

const ConfigureDomainSection = () => {
  const [customDomain, setCustomDomain] = useState('trustcenter.equinix.com')
  const [editing, setEditing] = useState(false)

  return (
    <div className="grid grid-cols-[250px_auto] gap-6 items-start border-b pb-8">
      {/* Left Column */}
      <div>
        <h1 className="text-xl text-text-header font-medium">Configure URL</h1>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Info box */}
        <div className="border rounded-md p-4 space-y-2 max-w-[730px]">
          <div className="flex items-start gap-2">
            <InfoIcon className="text-brand-100 shrink-0" size={16} />
            <div>
              <p className="text-sm font-medium ">Default domain availability</p>
              <p className="text-sm ">
                Even if you set up a vanity domain, your default domain will remain accessible. Vanity domains let you host your Trust Center on your company&apos;s root domain—for example,
                <span className="mx-1 font-medium text-text-header">trust.yourcompany.com</span>
                instead of yourcompany.theopenlane.net.
              </p>
            </div>
          </div>
        </div>

        {/* Default domain */}
        <div>
          <Label className="text-sm">Default</Label>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm">https://equinix.trust.theopenlane.io</span>
            <Button variant="outline" className="h-7 px-2 gap-1" icon={<Copy size={14} />} iconPosition="left">
              Copy
            </Button>
            <Button variant="outline" className="h-7 px-2 gap-1" icon={<ExternalLink size={14} />} iconPosition="left">
              Visit
            </Button>
          </div>
        </div>

        {/* Custom Domain */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Label className="text-sm">Custom Domain</Label>
            <SystemTooltip icon={<InfoIcon className="text-brand-100" size={14} />} content={<p>Configure your own domain name for your Trust Center.</p>} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <UrlInput value={customDomain} onChange={setCustomDomain} disabled={!editing} verified />
            {editing ? (
              <Button className="h-8 px-2 gap-1" onClick={() => setEditing(false)}>
                Save
              </Button>
            ) : (
              <>
                <Button className="gap-1 p-2" icon={<Pencil size={16} />} iconPosition="left" onClick={() => setEditing(true)}>
                  Edit
                </Button>

                <Button variant="outline" className="gap-1 p-2" icon={<Trash2 size={14} />} iconPosition="left">
                  Delete
                </Button>
              </>
            )}
          </div>
          <p className="mt-2 text-xs text-text-informational">Once your domain is set, you&apos;ll need to configure DNS records with your domain provider to complete the setup.</p>
          <Button variant="outline" className="mt-3 gap-2 h-8">
            Show DNS records
          </Button>
        </div>
      </div>
    </div>
  )
}
