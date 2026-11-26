import { CircleCheck, CircleX } from 'lucide-react'

type TVerifiedLabelProps = {
  verified?: boolean | null
}

export const VerifiedIcon = ({ verified }: TVerifiedLabelProps) =>
  verified ? <CircleCheck size={16} className="shrink-0 text-success" /> : <CircleX size={16} className="shrink-0 text-destructive" />

export const VerifiedLabel = ({ verified }: TVerifiedLabelProps) => (
  <span className="inline-flex items-center gap-1.5">
    <VerifiedIcon verified={verified} />
    {verified ? 'Yes' : 'No'}
  </span>
)
