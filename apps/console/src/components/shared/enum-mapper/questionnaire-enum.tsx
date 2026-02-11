import { CalendarCheck, CalendarClock, CalendarPlus, FolderPen, History, ListFilter, type LucideIcon } from 'lucide-react'

export enum QuestionnaireFilterIconName {
  Title = 'Title',
  UpdatedAt = 'UpdatedAt',
  CreatedAt = 'CreatedAt',
  Status = 'Status',
  SentDate = 'SentDate',
  DueDate = 'DueDate',
}

export const FilterIcons: Record<QuestionnaireFilterIconName, LucideIcon> = {
  [QuestionnaireFilterIconName.Title]: FolderPen,
  [QuestionnaireFilterIconName.UpdatedAt]: CalendarPlus,
  [QuestionnaireFilterIconName.CreatedAt]: History,
  [QuestionnaireFilterIconName.Status]: ListFilter,
  [QuestionnaireFilterIconName.SentDate]: CalendarCheck,
  [QuestionnaireFilterIconName.DueDate]: CalendarClock,
}
