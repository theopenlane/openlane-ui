import { Fragment } from 'react'
import { ArrowRight, Handshake, ShieldCheck, Sparkles } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { type OnboardingCard } from '@/lib/onboarding-questions/types'

const TRIAL_CARD_ICONS: Record<string, typeof ShieldCheck> = {
  compliance: ShieldCheck,
  trust_center: Handshake,
}

const DOMAIN_PLACEHOLDER = '{{domain}}'

type OnboardingTransitionCardProps = {
  totalSteps: number
  title: string
  description: string
  cards: OnboardingCard[]
  primaryDomain?: string
  onLeave: () => void
}

const OnboardingTransitionCard = ({ totalSteps, title, description, cards, primaryDomain, onLeave }: OnboardingTransitionCardProps) => (
  <Card className="w-full min-h-96 p-7 md:p-8 shadow-lg rounded-xl">
    <div className="flex flex-col gap-3 mb-8">
      <Badge variant="primary" className="w-fit uppercase tracking-wide border-primary/24">
        Step {totalSteps} of {totalSteps}
      </Badge>
      <div className="relative h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-full bg-primary rounded-full transition-all" />
      </div>
    </div>

    <div className="space-y-2 mb-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-text-light">
        {description.split(DOMAIN_PLACEHOLDER).map((part, index, parts) => (
          <Fragment key={index}>
            {part}
            {index < parts.length - 1 && <span className="font-mono text-xs">{primaryDomain || 'your domain'}</span>}
          </Fragment>
        ))}
      </p>
    </div>

    <div className="space-y-3">
      <p className="text-sm font-semibold">Included in your trial</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(({ key, title: cardTitle, description: cardDescription }) => {
          const Icon = TRIAL_CARD_ICONS[key] ?? Sparkles
          return (
            <div key={key} className="flex flex-col gap-2 rounded-md border border-border p-4">
              <Icon className="text-primary" size={20} />
              <p className="text-sm font-semibold">{cardTitle}</p>
              <p className="text-xs text-text-light">{cardDescription}</p>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-text-light">Free 30-day trial, no credit card required.</p>
    </div>

    <Button className="w-full mt-6" type="button" icon={<ArrowRight />} onClick={onLeave}>
      Explore Openlane
    </Button>
  </Card>
)

export default OnboardingTransitionCard
