import React from 'react'
import { type LucideIcon } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'

export type TLooksForItem = { icon: LucideIcon; title: string; description: string }

export const LooksForCard = ({ items }: { items: TLooksForItem[] }) => (
  <Card className="flex flex-col gap-4 p-5">
    <p className="text-sm font-semibold text-muted-foreground">What we&apos;ll look for</p>
    {items.map(({ icon: Icon, title, description }) => (
      <div key={title} className="flex items-start gap-3">
        <Icon size={18} className="mt-0.5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    ))}
  </Card>
)
