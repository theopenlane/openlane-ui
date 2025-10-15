import { Mail, MailCheck, ToggleRight, type LucideIcon } from 'lucide-react'

export enum SubscribersFilterIconName {
  Email = 'Email',
  Active = 'Active',
  Verified = 'Verified',
}

export const FilterIcons: Record<SubscribersFilterIconName, LucideIcon> = {
  [SubscribersFilterIconName.Email]: Mail,
  [SubscribersFilterIconName.Active]: ToggleRight,
  [SubscribersFilterIconName.Verified]: MailCheck,
}
