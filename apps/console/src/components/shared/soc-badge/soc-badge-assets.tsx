'use client'

import React, { useId, useState } from 'react'
import Image from 'next/image'
import { Download } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { CodeBlock } from '@repo/ui/code-block'
import { Label } from '@repo/ui/label'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { cn } from '@repo/ui/lib/utils'
import { isEnumValue } from '@/utils/type-guards'
import { SOC_BADGE_EMBED_WIDTH, SOC_BADGE_LOGOS, SocBadgeLogo, buildSocBadgeEmbedCode, socBadgeEmbedHeight } from './soc-badge-config'

type TSocBadgeAssetsProps = {
  logos: SocBadgeLogo[]
}

export const SocBadgeAssets: React.FC<TSocBadgeAssetsProps> = ({ logos }) => {
  const logoGroupId = useId()
  const [selected, setSelected] = useState<SocBadgeLogo>(logos[0])
  const logo = SOC_BADGE_LOGOS[selected]
  const embedCode = buildSocBadgeEmbedCode(selected)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label id={logoGroupId}>Logo</Label>
        <RadioGroup aria-labelledby={logoGroupId} value={selected} onValueChange={(value) => isEnumValue(SocBadgeLogo, value) && setSelected(value)} className="flex flex-wrap gap-3">
          {logos.map((option) => {
            const optionId = `${logoGroupId}-${option}`
            const meta = SOC_BADGE_LOGOS[option]

            return (
              <Label
                key={option}
                htmlFor={optionId}
                className={cn('flex min-w-0 max-w-full cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal', selected === option ? 'border-primary bg-primary/5' : 'border-border')}
              >
                <RadioGroupItem id={optionId} value={option} disabled={logos.length === 1} />
                <Image src={meta.path} alt="" width={48} height={48} unoptimized className="size-12 shrink-0 object-contain" />
                <span className="min-w-0 break-words text-sm leading-5">{meta.label}</span>
              </Label>
            )
          })}
        </RadioGroup>
        {logos.length === 1 && <p className="text-sm text-muted-foreground">The SOC 2 logo is only available with a SOC 2 report.</p>}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-base">Download the image</p>
        <div>
          <Button asChild variant="secondary" icon={<Download size={16} />} iconPosition="left">
            <a href={logo.path} download={logo.fileName}>
              Download {logo.label} logo
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-base">Or embed it with our hosted image</p>
        <p className="text-sm text-muted-foreground">
          Paste this into your website, for example in the footer. It links to the AICPA and shows the logo at {SOC_BADGE_EMBED_WIDTH}×{socBadgeEmbedHeight(selected)}px.
        </p>
        <CodeBlock code={embedCode} language="html" />
      </div>
    </div>
  )
}
