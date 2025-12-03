import { Card, CardContent } from '@repo/ui/cardpanel'
import { MessagesSquare } from 'lucide-react'

const DashboardContactSupport = () => {
  return (
    <Card>
      <CardContent className="p-6 flex items-start gap-4">
        <div className="p-2 rounded-md bg-success/10">
          <MessagesSquare className="text-success" size={18} />
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-sm">Contact Support</h3>
          <p className="text-xs text-muted">Add teammates so they can collaborate on controls, policies, and evidence.</p>

          <button className="mt-4 w-full bg-muted/20 hover:bg-muted/30 py-2 rounded-md text-sm">Contact Us</button>
        </div>
      </CardContent>
    </Card>
  )
}

export default DashboardContactSupport
