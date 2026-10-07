import { type LucideIcon } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'

export const ACKNOWLEDGEMENT_SECTION_TITLE_CLASS = 'text-base font-medium'

type TAcknowledgementSectionProps = {
  icon?: LucideIcon
  title?: string
  children: React.ReactNode
}

export const AcknowledgementSections = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col divide-y [&>*]:py-4 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">{children}</div>

export const AcknowledgementSection = ({ icon: Icon, title, children }: TAcknowledgementSectionProps) => (
  <section className="flex flex-col gap-2">
    {title && (
      <h3 className={cn('flex items-center gap-2', ACKNOWLEDGEMENT_SECTION_TITLE_CLASS)}>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />}
        {title}
      </h3>
    )}
    {children}
  </section>
)
