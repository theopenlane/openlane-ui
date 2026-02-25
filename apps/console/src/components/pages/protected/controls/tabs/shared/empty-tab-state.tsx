import React from 'react'
import { FileCheck } from 'lucide-react'

type EmptyTabStateProps = {
  title?: string
  description: string
}

const EmptyTabState: React.FC<EmptyTabStateProps> = ({ title = 'It looks like there are no items to display', description }) => (
  <div className="flex my-20 items-center justify-center px-6 text-center">
    <div className="max-w-[560px] space-y-3">
      <div className="mx-auto flex h-12 w-12 items-center justify-center text-muted-foreground">
        <FileCheck className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
)

export default EmptyTabState
