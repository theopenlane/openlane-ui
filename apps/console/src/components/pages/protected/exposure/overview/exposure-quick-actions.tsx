'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { Bug, FileSearch, Wrench, ClipboardCheck } from 'lucide-react'

const actions = [
  {
    label: 'View Vulnerabilities',
    href: '/exposure/vulnerabilities',
    icon: Bug,
    color: 'text-danger',
    bg: 'bg-danger/12',
  },
  {
    label: 'View Findings',
    href: '/exposure/findings',
    icon: FileSearch,
    color: 'text-warning',
    bg: 'bg-warning/12',
  },
  {
    label: 'Track Remediation',
    href: '/exposure/remediations',
    icon: Wrench,
    color: 'text-info',
    bg: 'bg-info/12',
  },
  {
    label: 'Audit Reviews',
    href: '/exposure/reviews',
    icon: ClipboardCheck,
    color: 'text-success',
    bg: 'bg-success/12',
  },
]

const ExposureQuickActions = () => {
  const router = useRouter()

  return (
    <div className="grid grid-cols-4 gap-4">
      {actions.map((action) => (
        <Card
          key={action.href}
          onClick={() => router.push(action.href)}
          className="bg-homepage-card border-homepage-card-border transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:-translate-y-1 cursor-pointer"
        >
          <CardTitle className="p-6 pb-0">
            <div className={`p-2 rounded-md ${action.bg} inline-flex items-center justify-center`}>
              <action.icon size={20} className={action.color} />
            </div>
          </CardTitle>
          <CardContent className="pt-3">
            <p className="leading-6 text-base font-medium">{action.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default ExposureQuickActions
