'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { Bug, FileSearch, Wrench, ClipboardCheck } from 'lucide-react'
import CreateRemediationSheet from '@/components/pages/protected/remediations/create-remediation-sheet'

const ExposureQuickActions = () => {
  const router = useRouter()
  const [createRemediationOpen, setCreateRemediationOpen] = useState(false)

  const actions = [
    {
      label: 'View Vulnerabilities',
      onClick: () => router.push('/exposure/vulnerabilities'),
      icon: Bug,
      color: 'text-danger',
      bg: 'bg-danger/12',
    },
    {
      label: 'View Findings',
      onClick: () => router.push('/exposure/findings'),
      icon: FileSearch,
      color: 'text-warning',
      bg: 'bg-warning/12',
    },
    {
      label: 'Track Remediation',
      onClick: () => setCreateRemediationOpen(true),
      icon: Wrench,
      color: 'text-info',
      bg: 'bg-info/12',
    },
    {
      label: 'Audit Reviews',
      onClick: () => router.push('/exposure/reviews'),
      icon: ClipboardCheck,
      color: 'text-success',
      bg: 'bg-success/12',
    },
  ]

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {actions.map((action) => (
          <Card
            key={action.label}
            onClick={action.onClick}
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
      <CreateRemediationSheet isOpen={createRemediationOpen} onClose={() => setCreateRemediationOpen(false)} />
    </>
  )
}

export default ExposureQuickActions
