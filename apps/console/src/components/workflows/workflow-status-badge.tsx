'use client'

import { Badge } from '@repo/ui/badge'
import { CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react'

type WorkflowStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

type WorkflowStatusBadgeProps = {
  status: WorkflowStatus | string
  size?: 'sm' | 'md' | 'lg'
}

export function WorkflowStatusBadge({ status, size = 'md' }: WorkflowStatusBadgeProps) {
  const getStatusConfig = (statusValue: string) => {
    const normalizedStatus = statusValue.toUpperCase()

    switch (normalizedStatus) {
      case 'PENDING':
        return {
          variant: 'secondary' as const,
          icon: <Clock className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />,
          label: 'Pending',
          color: 'text-amber-600',
        }
      case 'APPROVED':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />,
          label: 'Approved',
          color: 'text-green-600',
        }
      case 'REJECTED':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />,
          label: 'Rejected',
          color: 'text-red-600',
        }
      case 'CHANGES_REQUESTED':
        return {
          variant: 'secondary' as const,
          icon: <AlertCircle className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />,
          label: 'Changes requested',
          color: 'text-amber-600',
        }
      case 'IN_PROGRESS':
        return {
          variant: 'secondary' as const,
          icon: <Loader2 className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} animate-spin`} />,
          label: 'In Progress',
          color: 'text-blue-600',
        }
      case 'COMPLETED':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />,
          label: 'Completed',
          color: 'text-green-600',
        }
      case 'FAILED':
        return {
          variant: 'destructive' as const,
          icon: <AlertCircle className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />,
          label: 'Failed',
          color: 'text-red-600',
        }
      default:
        return {
          variant: 'secondary' as const,
          icon: <Clock className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />,
          label: statusValue,
          color: 'text-gray-600',
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${size === 'sm' ? 'text-xs' : ''}`}>
      <span className={config.color}>{config.icon}</span>
      <span>{config.label}</span>
    </Badge>
  )
}
