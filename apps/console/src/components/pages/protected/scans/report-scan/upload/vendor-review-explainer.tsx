import React from 'react'
import { CircleAlert, CircleCheck, CircleX, FileText, Gavel, Search, ShieldAlert, type LucideIcon } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { cn } from '@repo/ui/lib/utils'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { VendorRiskRating, type TVendorRiskRating } from '@/lib/vendor-risk-rating'
import { LooksForCard, type TLooksForItem } from './looks-for-card'

const VENDOR_LOOKS_FOR: TLooksForItem[] = [
  { icon: Gavel, title: 'Auditor opinion', description: 'Whether the opinion is unqualified, qualified, adverse or a disclaimer' },
  { icon: FileText, title: 'Summary', description: 'What system the report covers, the categories in scope and anything notable' },
  { icon: ShieldAlert, title: 'Risk rating', description: 'How risky relying on this vendor is, and why. It is saved to the vendor when the review finishes' },
  { icon: Search, title: 'Findings', description: 'Every exception the auditor noted, against its control' },
]

const OPINIONS: { icon: LucideIcon; iconClassName: string; title: string; description: string }[] = [
  {
    icon: CircleCheck,
    iconClassName: 'text-success',
    title: 'Unqualified (clean).',
    description: 'The auditor found the controls were designed well and, for a Type 2, worked as intended over the review period. This is the result you want to see.',
  },
  {
    icon: CircleAlert,
    iconClassName: 'text-warning',
    title: 'Qualified.',
    description: "Clean except for specific problems the auditor calls out. One or more controls weren't designed or working well, so read why before relying on the vendor.",
  },
  {
    icon: CircleX,
    iconClassName: 'text-destructive',
    title: 'Adverse.',
    description: "The auditor found problems serious and widespread enough that you can't rely on the vendor's controls.",
  },
  {
    icon: CircleX,
    iconClassName: 'text-destructive',
    title: 'Disclaimer of opinion.',
    description: "The auditor couldn't get enough evidence to give an opinion at all, so the report gives you no assurance about the vendor's controls.",
  },
]

const RISK_RATINGS: { rating: TVendorRiskRating; description: string }[] = [
  { rating: VendorRiskRating.LOW, description: 'A clean opinion and nothing in the findings that affects how you use the vendor. Rely on the report and review again on your usual schedule.' },
  { rating: VendorRiskRating.MEDIUM, description: "A qualified opinion or exceptions worth a look. Read the findings and confirm they don't touch the data or services you depend on." },
  { rating: VendorRiskRating.HIGH, description: 'Significant exceptions, or an adverse opinion or disclaimer. Follow up with the vendor before relying on this report.' },
  { rating: VendorRiskRating.CRITICAL, description: "Problems serious enough that you shouldn't rely on the vendor without remediation or compensating controls on your side." },
]

export const VendorReviewExplainer = () => (
  <>
    <LooksForCard items={VENDOR_LOOKS_FOR} />

    <Card className="flex flex-col gap-3 p-5">
      <p className="text-sm font-semibold text-muted-foreground">What the auditor&apos;s opinion means</p>
      {OPINIONS.map(({ icon: Icon, iconClassName, title, description }) => (
        <p key={title} className="flex items-start gap-2 text-sm">
          <Icon size={16} className={cn('mt-0.5 shrink-0', iconClassName)} />
          <span>
            <span className="font-semibold">{title}</span> <span className="text-muted-foreground">{description}</span>
          </span>
        </p>
      ))}
    </Card>

    <Card className="flex flex-col gap-3 p-5">
      <p className="text-sm font-semibold text-muted-foreground">How the risk rating is decided</p>
      {RISK_RATINGS.map(({ rating, description }) => (
        <p key={rating} className="text-sm">
          <span className="font-semibold">{getEnumLabel(rating)}:</span> <span className="text-muted-foreground">{description}</span>
        </p>
      ))}
    </Card>
  </>
)
