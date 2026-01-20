'use client'

import React, { useEffect, useState } from 'react'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { useHandleUpdateSetting } from './helpers/useHandleUpdateSetting'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { InfoIcon } from 'lucide-react'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Label } from '@repo/ui/label'
import { SaveButton } from '@/components/shared/save-button/save-button'

const TitleAndOverview = () => {
  const { data } = useGetTrustCenter()
  const { updateTrustCenterSetting, isPending } = useHandleUpdateSetting()

  const setting = data?.trustCenters?.edges?.[0]?.node?.setting

  const [title, setTitle] = useState('')
  const [overview, setOverview] = useState('')
  const [securityContact, setSecurityContact] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (setting) {
      setTitle(setting.title || '')
      setOverview(setting.overview || '')
      setSecurityContact(setting.securityContact || '')
      setIsDirty(false)
    }
  }, [setting])

  const validateEmail = (email: string) => {
    if (!email) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const isEmailValid = validateEmail(securityContact)

  const handleSave = async () => {
    if (!setting?.id || !isEmailValid) {
      return
    }

    updateTrustCenterSetting({
      id: setting.id,
      input: { title, overview, securityContact },
    })
  }

  if (!setting) return null

  return (
    <div className="grid grid-cols-[250px_auto] gap-6 items-start border-b pb-8">
      <div>
        <h1 className="text-xl text-text-header font-medium">Title and Overview</h1>
      </div>

      <div className="space-y-6 max-w-[730px]">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Label className="text-sm">Title</Label>
            <SystemTooltip icon={<InfoIcon className="text-brand-100" size={14} />} content={<p>The public name of your Trust Center.</p>} />
          </div>
          <Input
            id="trust-center-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setIsDirty(true)
            }}
            placeholder="Enter title"
            className="text-base"
          />
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <Label className="text-sm">Overview</Label>
            <SystemTooltip icon={<InfoIcon className="text-brand-100" size={14} />} content={<p>Provide a short description that introduces your Trust Center.</p>} />
          </div>
          <Textarea
            id="trust-center-overview"
            value={overview}
            onChange={(e) => {
              setOverview(e.target.value)
              setIsDirty(true)
            }}
            placeholder="Enter overview"
            rows={5}
            className="text-base"
          />
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <Label className="text-sm">Security Email Address</Label>
            <SystemTooltip icon={<InfoIcon className="text-brand-100" size={14} />} content={<p>Public contact email for responsible disclosure of security vulnerabilities</p>} />
          </div>
          <Input
            id="trust-center-security-contact"
            value={securityContact}
            onChange={(e) => {
              setSecurityContact(e.target.value)
              setIsDirty(true)
            }}
            placeholder="security@yourcompany.com"
            className={`text-base ${!isEmailValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          />
          {!isEmailValid && <p className="text-xs text-red-500 mt-1">Please enter a valid email address.</p>}
        </div>

        <SaveButton isSaving={isPending} onClick={handleSave} disabled={!isDirty || isPending || !isEmailValid} className="self-start gap-1" />
      </div>
    </div>
  )
}

export default TitleAndOverview
