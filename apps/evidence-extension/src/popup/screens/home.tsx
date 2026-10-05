import type { ReactNode } from 'react'
import { Camera, ChevronRight, Video } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import type { TConnection } from '../../lib/connection'

type TActionCardProps = {
  icon: ReactNode
  title: string
  description: string
  badge?: string
  onClick?: () => void
}

const ActionCard = ({ icon, title, description, badge, onClick }: TActionCardProps) => (
  <Button variant="outline" full childFull className="h-auto justify-start rounded-lg p-4 text-left" disabled={!onClick} onClick={onClick}>
    <span className="flex w-full items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex items-center gap-2 font-semibold text-foreground">
          {title}
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </span>
        <span className="block text-sm font-normal whitespace-normal text-muted-foreground">{description}</span>
      </span>
      {onClick && <ChevronRight className="mt-0.5 shrink-0 text-muted-foreground" />}
    </span>
  </Button>
)

type THomeProps = {
  collector: TConnection['collector']
  organizationName: string
  captureUnavailableReason?: string
  onCapture: () => void
  onOpenSettings: () => void
}

export const Home = ({ collector, organizationName, captureUnavailableReason, onCapture, onOpenSettings }: THomeProps) => (
  <div className="space-y-3 p-4">
    <ActionCard
      icon={<Camera />}
      title="Capture evidence"
      description={captureUnavailableReason ?? 'Take a screenshot of this tab and upload it as evidence.'}
      onClick={captureUnavailableReason ? undefined : onCapture}
    />
    <ActionCard icon={<Video />} title="Record evidence" description="Record your screen and upload it as evidence." badge="Soon" />
    <Button variant="outline" full childFull className="h-auto justify-start rounded-lg p-3 text-left" onClick={onOpenSettings}>
      <span className="flex w-full items-center gap-3">
        <Avatar className="size-9">
          {collector.avatarRemoteURL && <AvatarImage src={collector.avatarRemoteURL} alt="" />}
          <AvatarFallback>{(collector.displayName || collector.email).charAt(0).toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-foreground">{collector.displayName || collector.email}</span>
          <span className="block truncate text-sm font-normal text-muted-foreground">
            {collector.email} · {organizationName}
          </span>
        </span>
        <ChevronRight className="shrink-0 text-muted-foreground" />
      </span>
    </Button>
  </div>
)
