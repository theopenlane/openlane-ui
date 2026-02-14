import { CircleDot, FolderPen, Key, UserRoundCheck, UserRoundPen, Shapes, CalendarClock, LucideIcon, CircleDollarSign, IdCard } from 'lucide-react'

export enum FilterIconName {
  DisplayID = 'DisplayID',
  Title = 'Title',
  Name = 'Name',
  Type = 'Type',
  Status = 'Status',
  Assigner = 'Assigner',
  Assignee = 'Assignee',
  Date = 'Date',
  Cost = 'Cost',
  ID = 'ID',
}

export const FilterIcons: Record<FilterIconName, LucideIcon> = {
  [FilterIconName.DisplayID]: Key,
  [FilterIconName.Title]: FolderPen,
  [FilterIconName.Name]: FolderPen,
  [FilterIconName.Status]: CircleDot,
  [FilterIconName.Assigner]: UserRoundCheck,
  [FilterIconName.Assignee]: UserRoundPen,
  [FilterIconName.Type]: Shapes,
  [FilterIconName.Date]: CalendarClock,
  [FilterIconName.Cost]: CircleDollarSign,
  [FilterIconName.ID]: IdCard,
}
