import { Card, CardContent } from '@repo/ui/cardpanel'
import { LucideIcon } from 'lucide-react'

type SuggestedActionCardProps = {
  handleRouting: (route: string) => void
  icon: LucideIcon
  header: string
  subheader: string
  route: string
}

export const SuggestedActionCard = ({ handleRouting, icon: Icon, header, subheader, route }: SuggestedActionCardProps) => {
  return (
    <Card className="bg-btn-secondary w-full cursor-pointer">
      <CardContent>
        <div onClick={() => handleRouting(route)} className="flex items-center gap-4">
          <div className="flex items-center justify-center h-10 w-10  rounded-md bg-card">
            <Icon size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm text-text-paragraph font-medium leading-6">{header}</p>
            <p className="text-xs text-muted-foreground">{subheader}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
