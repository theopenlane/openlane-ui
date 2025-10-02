// app/programs/create/page.tsx
import { Badge } from '@repo/ui/badge'
import { Card } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'
import { ShieldCheck } from 'lucide-react'
import { Rectangle } from './shadow-rectangle'

const quickstartOptions = [
  {
    title: 'SOC 2',
    description: 'We’ll set up a SOC 2 program for you in under 2 minutes.',
    details: ['Select core trust principles.', 'Choose templates or your own policies.', 'Invite your team now or later.'],
  },
  {
    title: 'Risk Assessment',
    description: 'Easily create a risk register with built-in scoring & reporting.',
    details: ['Default risk scoring (likelihood × impact)', 'Standard risk categories', 'Sample controls pre-loaded'],
  },
  {
    title: 'Framework Based',
    description: 'Choose the compliance standard and we’ll get you started.',
    details: ['Select from any existing compliance standard', 'Choose templates or bring your own policies', 'Invite your team now or later'],
  },
]

function CardIllustration() {
  return (
    <Card className="relative h-36 w-full bg-secondary px-11 overflow-hidden">
      <Card className="relative h-32 w-full flex items-start justify-start bg-card mt-6">
        <div className="absolute inset-0 rounded-md" />
        {/* Shield Icon */}
        <ShieldCheck className="absolute top-3 left-3 h-5 w-5 text-teal-400" />
        {/* Fake input field */}
        <div className="absolute top-9 left-3 right-3 h-6 rounded-md border border-teal-400/60 bg-transparent" />
        {/* Fake text lines */}
        <div className="absolute bottom-8 left-3 h-1.5 w-3/5 rounded-full bg-white/20" />
        <div className="absolute bottom-4 left-3 h-1.5 w-2/5 rounded-full bg-white/10" />
      </Card>
      <Rectangle className="absolute top-2/4 left-0" />
    </Card>
  )
}

export default function ProgramsCreate() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight mb-4">Create New Program</h1>
      <Separator className="mb-8" />

      {/* Quickstart */}
      <div>
        <h2 className="text-sm uppercase text-muted-foreground mb-4">Quickstart</h2>
        <div className="flex gap-6">
          {quickstartOptions.map((option) => (
            <Card key={option.title} className="rounded-xl overflow-hidden hover:border-primary transition cursor-pointer p-4 min-w-[300px] max-w-[348px]">
              {/* Top area using HTML + CSS */}
              <CardIllustration />

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
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
