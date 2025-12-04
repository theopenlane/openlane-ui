import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { AlertTriangle, Box } from 'lucide-react'

const DashboardLatestActivity = () => {
  return (
    <Card>
      <CardTitle className="px-6 pt-6 text-lg font-semibold">Latest Activity</CardTitle>

      <CardContent className="px-6 pb-6 pt-4 space-y-4">
        <div className="flex items-center justify-between bg-muted/10 border border-muted/20 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-danger" size={18} />
            <span className="text-sm">This is a risk</span>
          </div>
          <button className="text-xs px-3 py-1 rounded-md bg-muted/20 hover:bg-muted/30">Review</button>
        </div>

        <div className="flex items-center justify-between bg-muted/10 border border-muted/20 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <Box className="text-info" size={18} />
            <span className="text-sm">This is an entity</span>
          </div>
          <button className="text-xs px-3 py-1 rounded-md bg-muted/20 hover:bg-muted/30">Review</button>
        </div>
      </CardContent>
    </Card>
  )
}

export default DashboardLatestActivity
