'use client'

import React from 'react'
import { MoreHorizontal, ArrowLeftRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@repo/ui/cardpanel'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Logo } from '@repo/ui/logo'

type IntegrationNode = {
  id: string
  name: string
  tags?: string[] | null
  description?: string | null
}

type IntegrationsGridProps = {
  items?: IntegrationNode[]
}

// const ICONS = [Boxes, GitBranch, Cloud, Shield, Plug, Database]
// const getIconForName = (name?: string) => {
//   if (!name) return Boxes
//   const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
//   return ICONS[hash % ICONS.length]
// }

export function IntegrationsGrid({ items }: IntegrationsGridProps) {
  if (!items?.length) {
    return (
      <div className="text-center py-16 border rounded-lg">
        <p className="text-muted-foreground">No integrations found.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-5">
      {items.map((integration) => (
        <IntegrationCard key={integration.id} integration={integration} />
      ))}
      <Card className="flex justify-center items-center">
        <div className="flex flex-col justify-center items-center gap-4">
          <h2>MIssing an Integration?</h2>
          <Button variant="outline" className="text-brand">
            Request
          </Button>
        </div>
      </Card>
    </div>
  )
}

function IntegrationCard({ integration }: { integration: IntegrationNode }) {
  //   const Icon = getIconForName(integration.name)

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
              <Logo asIcon width={27} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="truncate">{integration.name}</span>
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
        <Button className="w-full text-brand" variant="outline">
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
