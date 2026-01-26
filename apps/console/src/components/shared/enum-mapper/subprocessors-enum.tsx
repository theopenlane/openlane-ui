import { Globe, LucideIcon, Tag } from 'lucide-react'

export enum SubprocessorsFilterIconName {
  Category = 'Category',
  Country = 'Country',
}
export const SubprocessorsFilterIcons: Record<SubprocessorsFilterIconName, LucideIcon> = {
  [SubprocessorsFilterIconName.Category]: Tag,
  [SubprocessorsFilterIconName.Country]: Globe,
}
