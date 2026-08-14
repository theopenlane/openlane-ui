'use client'
import { Badge } from '@repo/ui/badge'
import { Card } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'
import { CopyPlus, FilePlus2, Wrench } from 'lucide-react'
import Link from 'next/link'
import Soc2Illustration from './illustrations/soc2-illustration'
import RiskAssessmentIllustration from './illustrations/risk-assessment-illustration'
import FrameworkBasedIllustration from './illustrations/framework-based-illustration'
import React, { useEffect, useState, use } from 'react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { usePathname } from 'next/navigation'
import { useOrganization } from '@/hooks/useOrganization'
import { getOnboardingFrameworks } from '@/lib/storage/onboarding-frameworks'

const quickstartOptions = [
  {
    id: 'soc2',
    title: 'SOC 2',
    description: "We'll set up a SOC 2 program for you in under 2 minutes.",
    details: ['Select core trust principles.', 'Choose templates or your own policies.', 'Invite your team now or later.'],
    illustration: <Soc2Illustration />,
    url: '/programs/create/soc2',
  },
  {
    id: 'risk-assessment',
    title: 'Risk Assessment',
    description: 'Easily create a risk register with built-in scoring & reporting.',
    details: ['Default risk scoring (likelihood x impact)', 'Standard risk categories', 'Sample controls pre-loaded'],
    illustration: <RiskAssessmentIllustration />,
    url: '/programs/create/risk-assessment',
  },
  {
    id: 'framework-based',
    title: 'Framework Based',
    description: "Choose the compliance standard and we'll get you started.",
    details: ['Select from any existing compliance standard', 'Choose templates or bring your own policies', 'Invite your team now or later'],
    illustration: <FrameworkBasedIllustration />,
    url: '/programs/create/framework-based',
  },
]

const isSoc2 = (framework: string) => /soc\s*2/i.test(framework)

type TProgramRecommendation = { id: string; url?: string; reason: string }

/**
 * Recommend starting points based on the frameworks chosen during onboarding.
 * SOC 2 recommends the SOC 2 quickstart; any other framework recommends
 * Framework Based with that standard preselected — both can apply at once
 */
function useProgramRecommendations(enabled: boolean): { recommendations: TProgramRecommendation[]; frameworks: string[] } {
  const { currentOrgId } = useOrganization()
  const [frameworks, setFrameworks] = useState<string[]>([])

  useEffect(() => {
    setFrameworks(enabled ? getOnboardingFrameworks(currentOrgId) : [])
  }, [currentOrgId, enabled])

  const recommendations: TProgramRecommendation[] = []
  if (!enabled) return { recommendations, frameworks: [] }

  const soc2 = frameworks.find(isSoc2)
  if (soc2) recommendations.push({ id: 'soc2', reason: `for ${soc2}` })

  const others = frameworks.filter((framework) => !isSoc2(framework))
  if (others.length > 0) {
    recommendations.push({
      id: 'framework-based',
      url: `/programs/create/framework-based?framework=${encodeURIComponent(others[0])}`,
      reason: `for ${others.join(', ')}`,
    })
  }

  return { recommendations, frameworks }
}

const customOptions = [
  {
    title: 'From Existing Program',
    description: 'Reuse controls, auditor and owner from a program',
    icon: <CopyPlus className="text-btn-primary" size={20} />,
    url: '/programs/create/from-existing',
  },
  {
    title: 'Generic Program',
    description: 'Start with a blank program structure',
    icon: <FilePlus2 className="text-btn-primary" size={20} />,
    url: '/programs/create/generic-program',
  },
  {
    title: 'Advanced Setup',
    description: 'Manually configure everything from the ground up.',
    icon: <Wrench className="text-btn-primary" size={20} />,
    url: '/programs/create/advanced-setup',
  },
]

interface ProgramsCreateProps {
  // the programs list renders this same component as its empty state, so the title
  // changes but the layout stays identical
  heading?: string
  noPrograms?: boolean
}

export default function ProgramsCreate({ heading = 'Create New Program', noPrograms = false }: ProgramsCreateProps) {
  const { setCrumbs } = use(BreadcrumbContext)
  const path = usePathname()
  // onboarding-based recommendations only make sense before the org has any
  // programs — after that, nothing is "recommended"
  const { recommendations, frameworks } = useProgramRecommendations(noPrograms)
  const recommendationFor = (id: string) => recommendations.find((r) => r.id === id)

  useEffect(() => {
    if (path.includes('/programs/create'))
      // we can be on /programs without any programs and this component can render so we only want to apply crumbs on programs/create
      setCrumbs([
        { label: 'Home', href: '/dashboard' },
        { label: 'Compliance', href: '/programs' },
        { label: 'Programs', href: '/programs' },
        { label: 'Create', href: '/programs/create' },
      ])
  }, [setCrumbs, path])

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-medium tracking-tight mb-6">{heading}</h1>
      <Separator className="" separatorClass="bg-card" />

      {/* Quickstart */}
      <div>
        <h2 className="mt-4 mb-1">Quickstart</h2>
        {noPrograms &&
          (recommendations.length > 0 ? (
            <p className="mb-3 text-sm text-muted-foreground">
              Based on your onboarding ({frameworks.join(', ')}), we suggest the {recommendations.length === 1 ? 'highlighted path' : 'highlighted paths'} below.
            </p>
          ) : (
            <p className="mb-3 text-sm text-muted-foreground">No programs yet — create one using any of the options below.</p>
          ))}
        <div className="mt-3 flex items-stretch gap-6">
          {quickstartOptions.map((option) => {
            const recommendation = recommendationFor(option.id)
            const isRecommended = !!recommendation
            return (
              <Link key={option.title} href={recommendation?.url ?? option.url} className="flex min-w-[300px] max-w-[348px] flex-1">
                <Card className={`flex h-full w-full flex-col rounded-xl overflow-hidden hover:border-primary transition cursor-pointer p-4 ${isRecommended ? 'border-primary' : ''}`}>
                  {/* Top area using HTML + CSS */}
                  {option.illustration}

                  {/* Content */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{option.title}</h3>
                      {isRecommended ? (
                        <Badge variant="green" className="text-xs">
                          Recommended
                        </Badge>
                      ) : (
                        <Badge variant={'outline'} className="text-xs">
                          Template
                        </Badge>
                      )}
                    </div>

                    {isRecommended && <p className="text-xs text-muted-foreground mb-2">{recommendation?.reason}</p>}
                    <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {option.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2">
                          <span className="mt-1.5 h-2 w-2 rounded-full border-muted-foreground border-2 shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Custom */}
      <div>
        <h2 className="mt-6 mb-3">Custom</h2>
        <div className="flex gap-6 flex-wrap max-w-[1092px]">
          {customOptions.map((option) => (
            <Link className="flex flex-1" key={option.title} href={option.url}>
              <Card className="flex w-full items-center gap-3 rounded-xl p-4 hover:border-primary transition cursor-pointer">
                <div className="flex items-center justify-center w-12 h-12 shrink-0 rounded-md bg-secondary border">{option.icon}</div>
                <div>
                  <h3 className="font-medium">{option.title}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
