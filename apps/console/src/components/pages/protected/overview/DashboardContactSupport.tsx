import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { MessagesSquare } from 'lucide-react'

const DashboardContactSupport = () => {
  return (
    <Card className="bg-homepage-card border-homepage-card-border">
      <CardContent className="p-6 flex flex-col gap-4 pb-4 h-full">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-md bg-success/10">
            <MessagesSquare className="text-success" size={18} />
          </div>

          <div className="flex-1">
            <h3 className="font-medium text-sm">Contact Support</h3>
            <p className="text-xs text-muted-foreground">Add teammates so they can collaborate on controls, policies, and evidence.</p>
          </div>
        </div>

        <Button variant="secondary" className="w-full mt-auto">
          Contact Us
        </Button>
      </CardContent>
    </Card>
  )
}

export default DashboardContactSupport
