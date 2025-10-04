'use client'
import React from 'react'
import { Shield, Search, BarChart3, FileText } from 'lucide-react'

interface ProgramType {
  id: string
  label: string
  description: string
  icon: React.ReactNode
}

const programTypes: ProgramType[] = [
  {
    id: 'framework',
    label: 'Framework',
    description: 'Use a compliance standard like SOC 2, ISO 27001, or NIST to structure your program.',
    icon: <Shield size={20} />,
  },
  {
    id: 'risk-assessment',
    label: 'Risk Assessment',
    description: 'Evaluate risks, assign scores, and generate a risk register with default categories.',
    icon: <Search size={20} />,
  },
  {
    id: 'gap-analysis',
    label: 'Gap Analysis',
    description: 'Identify what’s missing before committing to an audit or standard.',
    icon: <BarChart3 size={20} />,
  },
  {
    id: 'other',
    label: 'Other',
    description: 'For internal initiatives, pilots, or custom programs that don’t fit the categories above.',
    icon: <FileText size={20} />,
  },
]

const AdvancedSetupStep1 = () => {
  const [selected, setSelected] = React.useState<string | null>(null)

  return (
    <div className="flex flex-col">
      <div className="md:col-span-2">
        <h2 className="text-lg font-medium mb-1">Select a Program Type</h2>
        <p className="text-sm text-muted-foreground mb-6">Choose the type of program you’re creating. This helps us structure it correctly from the start.</p>

        <div className="flex flex-col gap-3">
          {programTypes.map((item) => {
            const isActive = selected === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item.id)}
                className={`flex items-start gap-3 rounded-md border p-4 text-left transition-colors
                  ${isActive ? 'border-btn-secondary bg-step-active-bg' : 'border-border bg-card hover:bg-card/80'}`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-md
                  ${isActive ? 'text-btn-secondary' : 'text-muted-foreground'}`}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AdvancedSetupStep1
