import { type LucideIcon } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum'

export const PolicyIcon = ObjectAssociationMap.policies.icon

type TAcknowledgementSectionProps = {
  icon: LucideIcon
  title: string
  className?: string
  children: React.ReactNode
}

export const AcknowledgementSection = ({ icon: Icon, title, className, children }: TAcknowledgementSectionProps) => (
  <section className={cn('flex flex-col gap-3', className)}>
    <h3 className="flex items-center gap-2 text-base font-medium">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      {title}
    </h3>
    {children}
  </section>
)
