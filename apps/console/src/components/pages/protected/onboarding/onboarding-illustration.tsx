import React, { useEffect, useState } from 'react'
import { Building2, Check, Cpu, Radar, ShieldCheck } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'

type ChecklistStatus = 'done' | 'active' | 'pending'

const checklist: { icon: typeof Building2; label: string; status: ChecklistStatus }[] = [
  { icon: Building2, label: 'Company profile', status: 'done' },
  { icon: ShieldCheck, label: 'Compliance frameworks', status: 'done' },
  { icon: Radar, label: 'Domain scan', status: 'active' },
  { icon: Cpu, label: 'Technologies used', status: 'pending' },
]

const scanningMessages = ['Scanning for findings...', 'Checking subdomains...', 'Detecting technologies...', 'Analyzing security posture...']

const OnboardingIllustration = () => {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % scanningMessages.length)
    }, 2200)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full overflow-hidden rounded-lg pr-4">
      <Card className="relative flex min-h-72 w-full flex-col gap-5 bg-card p-5">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-border" />
          <div className="h-2.5 w-2.5 rounded-full bg-border" />
          <div className="h-2.5 w-2.5 rounded-full bg-border" />
        </div>

        <div className="flex flex-col gap-3">
          {checklist.map(({ icon: Icon, label, status }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                  status === 'done' ? 'border-btn-primary bg-transparent shadow-primary16' : 'border-border bg-muted'
                }`}
              >
                {status === 'done' ? <Check size={14} className="text-btn-primary" /> : <Icon size={14} className={`text-text-light ${status === 'active' ? 'animate-pulse' : ''}`} />}
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="text-xs font-medium">{label}</span>
                <div className="h-1.5 w-3/4 rounded-full bg-border" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between rounded-md border border-border bg-secondary/60 p-3">
          <div className="flex items-center gap-2">
            <Radar size={16} className="text-btn-primary" />
            <span className="text-xs font-medium">{scanningMessages[messageIndex]}</span>
          </div>
          <div className="h-2 w-2 animate-ping rounded-full bg-btn-primary" />
        </div>
      </Card>
    </div>
  )
}

export default OnboardingIllustration
