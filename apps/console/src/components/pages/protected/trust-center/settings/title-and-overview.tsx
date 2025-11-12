'use client'

import React, { useEffect, useState } from 'react'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { useHandleUpdateSetting } from './helpers/useHandleUpdateSetting'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Button } from '@repo/ui/button'
import { InfoIcon } from 'lucide-react'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Label } from '@repo/ui/label'

const TitleAndOverview = () => {
  const { data } = useGetTrustCenter()
  const { updateTrustCenterSetting, isPending } = useHandleUpdateSetting()

  const setting = data?.trustCenters?.edges?.[0]?.node?.setting

  const [title, setTitle] = useState('')
  const [overview, setOverview] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (setting) {
      setTitle(setting.title || '')
      setOverview(setting.overview || '')
      setIsDirty(false)
    }
  }, [setting])

  const handleSave = async () => {
    if (!setting?.id) {
      return
    }

    updateTrustCenterSetting({
      id: setting.id,
      input: { title, overview },
    })
  }

  if (!setting) return null

  return (
    <div className="grid grid-cols-[250px_auto] gap-6 items-start border-b pb-8">
      {/* LEFT COLUMN */}
      <div>
        <h1 className="text-xl text-text-header font-medium">Title and Overview</h1>
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-6 max-w-[730px]">
        {/* Title field */}
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

        {/* Overview field */}
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

        <Button onClick={handleSave} disabled={!isDirty || isPending} className="self-start gap-1">
          {isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}

export default TitleAndOverview
