import { Eye, FolderPen, UsersRound, BadgeCheck, type LucideIcon } from 'lucide-react'

export enum GroupsFilterIconName {
  Name = 'Name',
  Visibility = 'Visibility',
  Owners = 'Owners',
  SystemOwned = 'SystemOwned',
}

export const FilterIcons: Record<GroupsFilterIconName, LucideIcon> = {
  [GroupsFilterIconName.Name]: FolderPen,
  [GroupsFilterIconName.Visibility]: Eye,
  [GroupsFilterIconName.Owners]: UsersRound,
  [GroupsFilterIconName.SystemOwned]: BadgeCheck,
}
