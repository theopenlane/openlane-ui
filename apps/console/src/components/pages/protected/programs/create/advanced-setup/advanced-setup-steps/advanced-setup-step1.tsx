'use client'
import React from 'react'
import { Shield, Search, BarChart3, FileText } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { useFormContext } from 'react-hook-form'

interface ProgramType {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  value: string
}

const programTypes: ProgramType[] = [
  {
    id: 'framework',
    label: 'Framework',
    description: 'Use a compliance standard like SOC 2, ISO 27001, or NIST to structure your program.',
    icon: <Shield className="text-btn-primary" size={20} />,
    value: 'Framework',
  },
  {
    id: 'risk-assessment',
    label: 'Risk Assessment',
    description: 'Evaluate risks, assign scores, and generate a risk register with default categories.',
    icon: <Search className="text-btn-primary" size={20} />,
    value: 'Risk Assessment',
  },
  {
    id: 'gap-analysis',
    label: 'Gap Analysis',
    description: 'Identify what’s missing before committing to an audit or standard.',
    icon: <BarChart3 className="text-btn-primary" size={20} />,
    value: 'Gap Analysis',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'For internal initiatives, pilots, or custom programs that don’t fit the categories above.',
    icon: <FileText className="text-btn-primary" size={20} />,
    value: 'Other',
  },
]

const AdvancedSetupStep1 = () => {
  const { setValue, watch } = useFormContext<{ programKindName?: string }>()
  const selected = watch('programKindName')

  return (
    <div className="flex flex-col">
      <div className="md:col-span-2">
        <h2 className="text-lg font-medium mb-1">Select a Program Type</h2>
        <p className="text-sm text-muted-foreground mb-6">Choose the type of program you’re creating. This helps us structure it correctly from the start.</p>

        <div className="flex flex-col gap-4">
          {programTypes.map((item) => {
            const isActive = selected === item.value
            return (
              <Card
                key={item.id}
                className={`flex flex-1 items-center gap-3 rounded-xl p-6 hover:border-primary transition cursor-pointer
                ${isActive ? 'border-primary shadow-primary24' : 'border-border'}`}
                onClick={() => setValue('programKindName', item.value, { shouldValidate: true })}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-md bg-secondary border shrink-0">
                  <div className={isActive ? 'text-primary' : 'text-muted-foreground'}>{item.icon}</div>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{item.label}</span>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AdvancedSetupStep1
