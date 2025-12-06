import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Headset } from 'lucide-react'
import { SUPPORT_URL } from '@/constants'

const DashboardContactSupport = () => {
  return (
    <Card className="bg-homepage-card border-homepage-card-border">
      <CardContent className="p-6 flex flex-col gap-4 pb-4 h-full">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-md border border-homepage-card-border bg-homepage-docs">
            <Headset className="text-homepage-action-icon" size={18} />
          </div>

          <div className="flex-1">
            <h3 className="font-medium text-sm">Contact Support</h3>
            <p className="text-xs text-muted-foreground">Got issues? Reach out. Our support team already tried turning themselves off and on again.</p>
          </div>
        </div>

        <a href={`${SUPPORT_URL}`} target="_blank" rel="noreferrer" aria-label="Contact Support Team" className="w-full mt-auto">
          <Button type="button" variant="secondary" className="w-full">
            Contact Us
          </Button>
        </a>
      </CardContent>
    </Card>
  )
}

export default DashboardContactSupport
