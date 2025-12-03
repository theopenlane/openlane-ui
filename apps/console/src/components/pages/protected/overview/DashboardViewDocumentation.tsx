import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { BookOpen } from 'lucide-react'

const DashboardViewDocumentation = () => {
  return (
    <Card>
      <CardContent className="p-6 flex items-start gap-4">
        <div className="p-2 rounded-md bg-info/10">
          <BookOpen className="text-info" size={18} />
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-sm">View Documentation</h3>
          <p className="text-xs text-muted">Add teammates so they can collaborate on controls, policies, and evidence.</p>

          <button className="mt-4 w-full bg-muted/20 hover:bg-muted/30 py-2 rounded-md text-sm">View Docs</button>
        </div>
      </CardContent>
    </Card>
  )
}

export default DashboardViewDocumentation
