import { Globe } from 'lucide-react'

type TPageCardProps = {
  url: URL
}

export const PageCard = ({ url }: TPageCardProps) => (
  <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
    <Globe className="shrink-0 text-muted-foreground" size={20} />
    <div className="min-w-0 text-sm">
      <p className="text-xs text-muted-foreground">Current page</p>
      <p className="truncate font-semibold">{url.hostname}</p>
      <p className="truncate text-muted-foreground" title={url.pathname}>
        {url.pathname}
      </p>
    </div>
  </div>
)
