import { Fragment } from 'react'
import { Handshake, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import OnboardingCardProgress from '@/components/pages/protected/onboarding/onboarding-card-progress'
import { type OnboardingCard } from '@/lib/onboarding-questions/types'

const TRIAL_CARD_ICONS: Record<string, typeof ShieldCheck> = {
  compliance: ShieldCheck,
  trust_center: Handshake,
}

const DOMAIN_PLACEHOLDER = '{{domain}}'

type OnboardingTransitionCardProps = {
  stepLabel?: string
  title: string
  description: string
  cards: OnboardingCard[]
  primaryDomain?: string
}

const OnboardingTransitionCard = ({ stepLabel, title, description, cards, primaryDomain }: OnboardingTransitionCardProps) => (
  <Card className="w-full min-h-96 p-5 sm:p-8 shadow-lg rounded-xl">
    <OnboardingCardProgress label={stepLabel} progress={1} />

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

    <Button className="w-full mt-6" type="button" loading disabled>
      Preparing your workspace
    </Button>
    <p className="mt-2 text-center text-xs text-text-light" role="status">
      We&apos;re creating your recommended next steps. This can take up to a minute.
    </p>
  </Card>
)

export default OnboardingTransitionCard
