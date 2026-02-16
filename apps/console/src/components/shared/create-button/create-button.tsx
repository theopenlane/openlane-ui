'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Plus,
  Settings2,
  ListChecks,
  AlertTriangle,
  Users,
  type LucideIcon,
  Pencil,
  ShieldCheck,
  Fingerprint,
  ScrollText,
  NotebookPen,
  Award,
  Box,
  User,
  LaptopIcon,
  Building2Icon,
  UsersRoundIcon,
} from 'lucide-react'
import ControlImplementationIcon from '@/assets/ControlImplementationIcon'
import ControlObjectiveIcon from '@/assets/ControlObjectiveIcon'
import MapControlIcon from '@/assets/MapControlIcon'
import SubcontrolIcon from '@/assets/SubcontrolIcon'
import ProcedureIcon from '@/assets/ProcedureIcon'
import EntityIcon from '@/assets/EntityIcon'

type CreateType =
  | 'general'
  | 'task'
  | 'program'
  | 'risk'
  | 'control'
  | 'subcontrol'
  | 'map-control'
  | 'evidence'
  | 'policy'
  | 'procedure'
  | 'questionnaire'
  | 'standard'
  | 'associated-object'
  | 'control-implementation'
  | 'control-objective'
  | 'entity'
  | 'group'
  | 'user'
  | 'asset'
  | 'vendor'
  | 'personnel'

type RegistryItem = {
  label: string
  icon: LucideIcon
}

const CREATE_REGISTRY: Record<CreateType, RegistryItem> = {
  general: { label: 'general', icon: Pencil },
  task: { label: 'task', icon: ListChecks },
  program: { label: 'program', icon: ShieldCheck },
  risk: { label: 'risk', icon: AlertTriangle },
  control: { label: 'control', icon: Settings2 },
  subcontrol: { label: 'subcontrol', icon: SubcontrolIcon },
  'map-control': { label: 'map control', icon: MapControlIcon },
  evidence: { label: 'evidence', icon: Fingerprint },
  policy: { label: 'policy', icon: ScrollText },
  procedure: { label: 'procedure', icon: ProcedureIcon },
  questionnaire: { label: 'questionnaire', icon: NotebookPen },
  standard: { label: 'standard', icon: Award },
  'associated-object': { label: 'associated object', icon: Box },
  'control-implementation': { label: 'control implementation', icon: ControlImplementationIcon },
  'control-objective': { label: 'control objective', icon: ControlObjectiveIcon },
  entity: { label: 'entity', icon: EntityIcon },
  group: { label: 'group', icon: Users },
  user: { label: 'user', icon: User },
  asset: { label: 'asset', icon: LaptopIcon },
  vendor: { label: 'vendor', icon: Building2Icon },
  personnel: { label: 'personnel', icon: UsersRoundIcon },
}

export type CreateButtonProps = {
  type: CreateType
  href?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  ariaLabel?: string
  leftIcon?: LucideIcon
  rightIcon?: LucideIcon
  leftIconSize?: number
  className?: string
  disabled?: boolean
  title?: string
}

export const CreateButton: React.FC<CreateButtonProps> = ({ type, href, onClick, ariaLabel, leftIcon, rightIcon: RightIcon = Plus, leftIconSize = 16, className = '', disabled, title }) => {
  const reg = CREATE_REGISTRY[type]
  const LeftIcon = leftIcon ?? reg.icon
  const finalAria = ariaLabel ?? `Create ${reg.label}`

  const inner = (
    <div
      className={['inline-flex items-center rounded-md border px-1 h-8', disabled ? 'opacity-60 pointer-events-none' : 'hover:bg-muted/40 cursor-pointer', className].join(' ')}
      role="button"
      aria-label={finalAria}
      title={title ?? finalAria}
    >
      <LeftIcon size={leftIconSize} className="mr-1" aria-hidden />
      {title && <span className="text-sm leading-none ml-1 mr-2">{title}</span>}
      <span className="h-4 border-r" />
      <RightIcon size={16} className="ml-1" aria-hidden />
    </div>
  )

  if (href) {
    return (
      <Link href={href} aria-label={finalAria}>
        {inner}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={finalAria} title={title ?? finalAria} className="contents">
      {inner}
    </button>
  )
}
