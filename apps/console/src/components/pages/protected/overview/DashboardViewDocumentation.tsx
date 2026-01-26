import { Card, CardContent } from '@repo/ui/cardpanel'
import { FileText } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { DOCS_URL } from '@/constants/docs.ts'

const DashboardViewDocumentation = () => {
  return (
    <Card className="bg-homepage-card border-homepage-card-border">
      <CardContent className="p-6 flex flex-col gap-4 pb-4 h-full">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-md border border-homepage-card-border bg-homepage-docs">
            <FileText className="text-homepage-action-icon" size={18} />
          </div>

          <div className="flex-1">
            <h3 className="font-medium text-sm">View Documentation</h3>
            <p className="text-xs text-muted-foreground"> Learn how to set up programs, write policies, upload evidence, and more, all written by people who definitely learned the hard way.</p>
          </div>
        </div>

        <a href={`${DOCS_URL}`} target="_blank" rel="noreferrer" aria-label="View Compliance Management Documentation" className="w-full mt-auto">
          <Button type="button" variant="secondary" className="w-full">
            View Docs
          </Button>
        </a>
      </CardContent>
    </Card>
  )
}

export default DashboardViewDocumentation
