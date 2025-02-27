import { Card } from '@repo/ui/cardpanel'
import { Info, TriangleAlert, CircleX } from 'lucide-react'

type SeverityCardProps = {
  severity?: 'info' | 'warning' | 'error'
  children: React.ReactNode
  title?: string
}

export const SeverityCard: React.FC<SeverityCardProps> = ({ severity, title, children }) => {
  const icons = {
    info: Info,
    warning: TriangleAlert,
    error: CircleX,
  }

  const IconComponent = severity ? icons[severity] : Info

  return (
    <Card className="mt-6 p-4 flex gap-3">
      <IconComponent className="mt-1" size={16} />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
    </Card>
  )
}
