'use client'
import { Badge } from '@repo/ui/badge'
import { Card } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'
import { FilePlus2, Wrench } from 'lucide-react'
import Link from 'next/link'
import Soc2Illustration from './illustrations/soc2-illustration'
import RiskAssessmentIllustration from './illustrations/risk-assessment-illustration'
import FrameworkBasedIllustration from './illustrations/framework-based-illustration'
import React, { useEffect, useContext } from 'react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { usePathname } from 'next/navigation'

const quickstartOptions = [
  {
    title: 'SOC 2',
    description: "We'll set up a SOC 2 program for you in under 2 minutes.",
    details: ['Select core trust principles.', 'Choose templates or your own policies.', 'Invite your team now or later.'],
    illustration: <Soc2Illustration />,
    url: '/programs/create/soc2',
  },
  {
    title: 'Risk Assessment',
    description: 'Easily create a risk register with built-in scoring & reporting.',
    details: ['Default risk scoring (likelihood x impact)', 'Standard risk categories', 'Sample controls pre-loaded'],
    illustration: <RiskAssessmentIllustration />,
    url: '/programs/create/risk-assessment',
  },
  {
    title: 'Framework Based',
    description: "Choose the compliance standard and we'll get you started.",
    details: ['Select from any existing compliance standard', 'Choose templates or bring your own policies', 'Invite your team now or later'],
    illustration: <FrameworkBasedIllustration />,
    url: '/programs/create/framework-based',
  },
]

const customOptions = [
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

// Add this interface
interface ProgramsCreateProps {
  disableHeader?: boolean
  noPrograms?: boolean
}

export default function ProgramsCreate({ disableHeader = false, noPrograms = false }: ProgramsCreateProps) {
  const { setCrumbs } = useContext(BreadcrumbContext)
  const path = usePathname()

  useEffect(() => {
    if (path.includes('/programs/create'))
      // we can be on /programs without any programs and this component can render so we only want to apply crumbs on programs/create
      setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Compliance' }, { label: 'Programs', href: '/programs' }, { label: 'Create', href: '/programs/create' }])
  }, [setCrumbs, path])

  return (
    <div className="max-w-6xl mx-auto">
      {!disableHeader && (
        <>
          <h1 className="text-2xl font-medium tracking-tight mb-6">Create New Program</h1>
          <Separator className="" separatorClass="bg-card" />
        </>
      )}

      {/* Quickstart */}
      <div>
        {noPrograms ? (
          <p className="mt-6 mb-3 max-w-3xl rounded-md border border-border/40 bg-muted/10 px-4 py-2 text-left text-[0.95rem] text-muted-foreground">
            No programs found. <span className="text-foreground font-medium">Create one now</span> using any of the options below.
          </p>
        ) : (
          <h2 className="mb-3 mt-4">Quickstart</h2>
        )}
        <div className="flex gap-6">
          {quickstartOptions.map((option) => (
            <Link key={option.title} href={option.url}>
              <Card className="rounded-xl overflow-hidden hover:border-primary transition cursor-pointer p-4 min-w-[300px] max-w-[348px]">
                {/* Top area using HTML + CSS */}
                {option.illustration}

                {/* Content */}
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{option.title}</h3>
                    <Badge variant={'outline'} className="text-xs">
                      Template
                    </Badge>
                  </div>

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
          ))}
        </div>
      </div>

      {/* Custom */}
      <div>
        <h2 className="mt-6 mb-3">Custom</h2>
        <div className="flex gap-6 flex-wrap max-w-[1092px]">
          {customOptions.map((option) => (
            <Link className="flex flex-1" key={option.title} href={option.url}>
              <Card className="flex w-full items-center gap-3 rounded-xl p-4 hover:border-primary transition cursor-pointer">
                <div className="flex items-center justify-center w-12 h-12 rounded-md bg-secondary border">{option.icon}</div>
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
