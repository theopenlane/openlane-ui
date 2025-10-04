// app/programs/create/page.tsx
import { Badge } from '@repo/ui/badge'
import { Card } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'
import { FilePlus2, Wrench } from 'lucide-react'
import Link from 'next/link'
import Soc2Illustration from './ilustrations/soc2-illustration'
import RiskAssessmentIllustration from './ilustrations/risk-assessment-illustration'
import FrameworkBasedIllustration from './ilustrations/framework-based-illustration'

const quickstartOptions = [
  {
    title: 'SOC 2',
    description: "We'll set up a SOC 2 program for you in under 2 minutes.",
    details: ['Select core trust principles.', 'Choose templates or your own policies.', 'Invite your team now or later.'],
    illustration: <Soc2Illustration />,
  },
  {
    title: 'Risk Assessment',
    description: 'Easily create a risk register with built-in scoring & reporting.',
    details: ['Default risk scoring (likelihood × impact)', 'Standard risk categories', 'Sample controls pre-loaded'],
    illustration: <RiskAssessmentIllustration />,
  },
  {
    title: 'Framework Based',
    description: 'Choose the compliance standard and we’ll get you started.',
    details: ['Select from any existing compliance standard', 'Choose templates or bring your own policies', 'Invite your team now or later'],
    illustration: <FrameworkBasedIllustration />,
  },
]

const customOptions = [
  {
    title: 'Generic Program',
    description: 'Start with a blank program structure',
    icon: <FilePlus2 className="text-btn-secondary" size={20} />,
    url: '/programs/create/generic-program',
  },
  {
    title: 'Advanced Setup',
    description: 'Manually configure everything from the ground up.',
    icon: <Wrench className="text-btn-secondary" size={20} />,
    url: '/programs/create/advanced-setup',
  },
]

export default function ProgramsCreate() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-2">
      <h1 className="text-2xl font-medium tracking-tight mb-6">Create New Program</h1>
      <Separator className="" separatorClass="bg-card" />

      {/* Quickstart */}
      <div>
        <h2 className="mb-3 mt-4">Quickstart</h2>
        <div className="flex gap-6">
          {quickstartOptions.map((option) => (
            <Link key={option.title} href={option.title === 'SOC 2' ? '/programs/create/soc2' : '#'}>
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
