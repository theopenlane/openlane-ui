import { Eye, FolderPen, type LucideIcon } from 'lucide-react'

export enum GroupsFilterIconName {
  Name = 'Name',
  Visibility = 'Visibility',
}

export const FilterIcons: Record<GroupsFilterIconName, LucideIcon> = {
  [GroupsFilterIconName.Name]: FolderPen,
  [GroupsFilterIconName.Visibility]: Eye,
}
