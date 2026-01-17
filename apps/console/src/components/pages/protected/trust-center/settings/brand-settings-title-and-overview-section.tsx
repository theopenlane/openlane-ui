import { Card, CardContent } from '@repo/ui/cardpanel'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'

type BrandSettingsTitleAndOverviewProps = {
  title: string
  setTitle: React.Dispatch<React.SetStateAction<string>>
  overview: string
  setOverview: React.Dispatch<React.SetStateAction<string>>
}

export const BrandSettingsTitleAndOverviewSection = (props: BrandSettingsTitleAndOverviewProps) => {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium leading-6">Title and Overview</p>
            <p className="text-sm text-inverted-muted-foreground font-medium leading-6">
              This information appears prominently at the top of your Trust Center and is also used for SEO metadata, including the page title and description.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-base font-medium leading-6">Title</p>
            <Input
              id="trust-center-title"
              value={props.title}
              onChange={(e) => {
                props.setTitle(e.target.value)
              }}
              placeholder="Enter title"
              className="text-base"
            />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-base font-medium leading-6">Overview</p>
            <Textarea
              id="trust-center-overview"
              value={props.overview}
              onChange={(e) => {
                props.setOverview(e.target.value)
              }}
              placeholder="Enter overview"
              rows={5}
              className="text-base"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
