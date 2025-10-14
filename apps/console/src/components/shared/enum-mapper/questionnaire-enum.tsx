import { CalendarPlus, FolderPen, History, type LucideIcon } from 'lucide-react'

export enum QuestionnaireFilterIconName {
  Title = 'Title',
  UpdatedAt = 'UpdatedAt',
  CreatedAt = 'CreatedAt',
}

export const FilterIcons: Record<QuestionnaireFilterIconName, LucideIcon> = {
  [QuestionnaireFilterIconName.Title]: FolderPen,
  [QuestionnaireFilterIconName.UpdatedAt]: CalendarPlus,
  [QuestionnaireFilterIconName.CreatedAt]: History,
}
