'use client'

import React, { useState } from 'react'
import { MoreHorizontal, ArrowLeftRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@repo/ui/cardpanel'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Logo } from '@repo/ui/logo'
import { AVAILABLE_INTEGRATIONS, getIntegrationId, IntegrationNode } from './config'
import { useDisconnectIntegration } from '@/lib/graphql-hooks/integration'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'

const InstalledIntegrationCard = ({ integration }: { integration: IntegrationNode }) => {
  const disconnectMutation = useDisconnectIntegration()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleDisconnect = () => {
    disconnectMutation.mutate({ id: integration.id })
    setConfirmOpen(false)
  }

  const integrationId = getIntegrationId(integration.name)
  const integrationConfig = AVAILABLE_INTEGRATIONS.find((ai) => ai.id === integrationId)

  return (
    <>
      <Card className="h-full justify-between flex flex-col min-h-[300px]">
        <div>
          <CardHeader className="flex-row items-start gap-3 space-y-0">
            <div className="flex gap-4">
              <div className="flex items-center gap-1 self-start">
                <div className="w-[34px] h-[34px] border rounded-full flex items-center justify-center ">
                  <Logo asIcon width={16} />
                </div>
                <ArrowLeftRight size={8} />
                <div className="w-[42px] h-[42px] border rounded-full flex items-center justify-center">{integrationConfig?.Icon}</div>
              </div>
              <div className="flex flex-col">
                <span>{integration.name}</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {integration.tags?.length ? (
                    <>
                      {integration.tags.slice(0, 6).map((t, i) => (
                        <TagChip key={i} tag={t} />
                      ))}
                      {integration.tags.length > 6 && <Badge variant="outline">+{integration.tags.length - 6}</Badge>}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <CardDescription className="line-clamp-5">{integration.description || 'Connect to keep your workflows connected and risks actionable.'}</CardDescription>
          </CardContent>
        </div>

        <CardFooter className="justify-between gap-2.5 flex-1 items-end">
          <Button className="w-full" disabled>
            Installed
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="-mr-2" variant="secondary">
                <MoreHorizontal className="h-4 w-4 text-brand" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <a href={integrationConfig?.docsUrl} target="_blank" rel="noreferrer">
                <DropdownMenuItem>Read docs</DropdownMenuItem>
              </a>
              <DropdownMenuItem onClick={() => setConfirmOpen(true)}>Disconnect</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDisconnect}
        title={`Disconnect ${integration.name}?`}
        description={`This will disconnect ${integration.name}. You can reconnect it later if needed.`}
        confirmationText="Disconnect"
        confirmationTextVariant="destructive"
      />
    </>
  )
}

export default InstalledIntegrationCard
