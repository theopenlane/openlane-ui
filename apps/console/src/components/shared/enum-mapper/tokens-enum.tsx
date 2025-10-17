import { CalendarClock, FileText, FolderPen, type LucideIcon } from 'lucide-react'

export enum TokensFilterIconName {
  Name = 'Name',
  Description = 'Description',
  ExpiresAt = 'ExpiresAt',
}

export const FilterIcons: Record<TokensFilterIconName, LucideIcon> = {
  [TokensFilterIconName.Name]: FolderPen,
  [TokensFilterIconName.Description]: FileText,
  [TokensFilterIconName.ExpiresAt]: CalendarClock,
}
