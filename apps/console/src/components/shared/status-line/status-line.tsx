import { Loader2 } from 'lucide-react'

export const StatusLine = ({ children }: { children: React.ReactNode }) => (
  <p className="inline-flex items-center gap-2 text-sm text-muted-foreground" role="status">
    <Loader2 className="size-4 animate-spin" />
    {children}
  </p>
)
