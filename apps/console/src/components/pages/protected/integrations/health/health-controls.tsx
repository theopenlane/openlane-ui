'use client'

import React from 'react'
import { Activity, Settings } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { type TRunErrorSummary } from '@/lib/integrations/run-health'

type THealthCheckButtonProps = {
  onClick: () => void
  isChecking: boolean
  disabled?: boolean
  label?: string
  variant?: 'primary' | 'secondary'
}

export const HealthCheckButton = ({ onClick, isChecking, disabled, label = 'Health Check', variant = 'primary' }: THealthCheckButtonProps) => (
  <Button variant={variant} icon={<Activity className="size-4" />} iconPosition="left" onClick={onClick} disabled={isChecking || disabled}>
    {isChecking ? 'Checking...' : label}
  </Button>
)

export const ConfigureButton = ({ onClick }: { onClick: () => void }) => (
  <Button variant="secondary" icon={<Settings className="size-4" />} iconPosition="left" onClick={onClick}>
    Configure
  </Button>
)

export const HttpStatusChip = ({ status }: { status: number }) => <span className="mr-1.5 rounded bg-destructive/16 px-1.5 py-0.5 font-mono text-xs text-destructive">{status}</span>

export const RunErrorText = ({ error }: { error: TRunErrorSummary }) => (
  <>
    {error.httpStatus ? <HttpStatusChip status={error.httpStatus} /> : null}
    {error.message}
  </>
)
