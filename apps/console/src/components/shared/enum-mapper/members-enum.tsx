import { CalendarPlus, CircleDot, IdCard, Plug, type LucideIcon } from 'lucide-react'

export enum InvitesFilterIconName {
  CreatedAt = 'CreatedAt',
  Role = 'Role',
  Status = 'Status',
}

export const InvitesFilterIcons: Record<InvitesFilterIconName, LucideIcon> = {
  [InvitesFilterIconName.CreatedAt]: CalendarPlus,
  [InvitesFilterIconName.Role]: IdCard,
  [InvitesFilterIconName.Status]: CircleDot,
}

export enum MembersFilterIconName {
  Providers = 'Providers',
  Role = 'Role',
}

export const MembersFilterIcons: Record<MembersFilterIconName, LucideIcon> = {
  [MembersFilterIconName.Providers]: Plug,
  [MembersFilterIconName.Role]: IdCard,
}
