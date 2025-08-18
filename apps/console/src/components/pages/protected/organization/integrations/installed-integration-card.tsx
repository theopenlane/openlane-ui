'use client'

import React from 'react'
import { MoreHorizontal, ArrowLeftRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@repo/ui/cardpanel'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Logo } from '@repo/ui/logo'
import { IntegrationNode } from './config'
import Github from '@/assets/Github'
import Slack from '@/assets/Slack'

const InstalledIntegrationCard = ({ integration }: { integration: IntegrationNode }) => {
  const Icon = () => {
    if (integration.name.toLowerCase().includes('github')) {
      return <Github />
    }
    if (integration.name.toLowerCase().includes('slack')) {
      return <Slack />
    }
  }

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'github',
          scopes: ['read:user', 'user:email', 'repo'],
          redirect_uri: `${window.location.origin}/organization-settings/integrations`,
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e?.error || 'OAuth start failed')
      }
      const { authUrl, url } = await res.json()
      const redirectTo = authUrl ?? url
      if (!redirectTo) throw new Error('Missing authUrl in response')
      window.location.assign(redirectTo)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <div className="w-[34px] h-[34px] border rounded-full flex items-center justify-center">
              <Logo asIcon width={16} />
            </div>
            <ArrowLeftRight size={8} />
            <div className="w-[42px] h-[42px] border rounded-full flex items-center justify-center">
              <Icon />
            </div>
          </div>
          <div className="flex flex-col">
            <span>{integration.name}</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {integration.tags?.length ? (
                <>
                  {integration.tags.slice(0, 6).map((t, i) => (
                    <Badge key={i} variant="secondary" className="font-normal">
                      {t}
                    </Badge>
                  ))}
                  {integration.tags.length > 6 && <Badge variant="outline">+{integration.tags.length - 6}</Badge>}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <CardDescription className="line-clamp-3">{integration.description || 'Connect to keep your workflows connected and risks actionable.'}</CardDescription>
      </CardContent>

      <CardFooter className="justify-between gap-2.5">
        <Button className="w-full text-brand" variant="outline" onClick={handleConnect}>
          Connect
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="-mr-2" variant="outline">
              <MoreHorizontal className="h-4 w-4 text-brand" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Read docs</DropdownMenuItem>
            <DropdownMenuItem>Changelog</DropdownMenuItem>
            <DropdownMenuItem>Report issue</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}

export default InstalledIntegrationCard
