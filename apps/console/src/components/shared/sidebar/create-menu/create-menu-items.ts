import { ClipboardCheckIcon, FileTextIcon, FingerprintIcon, GalleryVerticalEndIcon, GaugeIcon, MessageCirclePlusIcon, ShieldCheckIcon, WorkflowIcon } from '@/components/shared/icons/animated'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { type NavIcon } from '@/types'

export type CreateMenuDialogKey = 'task' | 'evidence' | 'contact'

type CreateMenuItemBase = {
  label: string
  icon: NavIcon
  objectType?: ObjectTypes
  permission?: AccessEnum
}

export type CreateMenuItem = CreateMenuItemBase & ({ href: string; dialog?: never } | { href?: never; dialog: CreateMenuDialogKey })

export const CREATE_MENU_ITEMS: CreateMenuItem[] = [
  {
    label: 'Task',
    icon: ClipboardCheckIcon,
    dialog: 'task',
  },
  {
    label: 'Program',
    icon: ShieldCheckIcon,
    href: '/programs/create',
    objectType: ObjectTypes.PROGRAM,
    permission: AccessEnum.CanCreateProgram,
  },
  {
    label: 'Evidence',
    icon: FingerprintIcon,
    dialog: 'evidence',
    objectType: ObjectTypes.EVIDENCE,
    permission: AccessEnum.CanCreateEvidence,
  },
  {
    label: 'Policy',
    icon: FileTextIcon,
    href: '/policies/create',
    objectType: ObjectTypes.INTERNAL_POLICY,
    permission: AccessEnum.CanCreateInternalPolicy,
  },
  {
    label: 'Procedure',
    icon: WorkflowIcon,
    href: '/procedures/create',
    objectType: ObjectTypes.PROCEDURE,
    permission: AccessEnum.CanCreateProcedure,
  },
  {
    label: 'Risk',
    icon: GaugeIcon,
    href: '/exposure/risks/create',
    objectType: ObjectTypes.RISK,
    permission: AccessEnum.CanCreateRisk,
  },
  {
    label: 'Trust Center Update',
    icon: MessageCirclePlusIcon,
    href: '/trust-center/updates',
    objectType: ObjectTypes.TRUST_CENTER,
    permission: AccessEnum.CanEditTrustCenter,
  },
  {
    label: 'Contact',
    icon: GalleryVerticalEndIcon,
    dialog: 'contact',
    objectType: ObjectTypes.CONTACT,
    permission: AccessEnum.CanCreateContact,
  },
]
