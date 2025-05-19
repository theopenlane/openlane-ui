import { Circle, CircleCheck, CircleOff, ScanEye, Timer } from 'lucide-react'
import { TaskTaskStatus } from '@repo/codegen/src/schema.ts'

export const TaskStatusIconMapper: Record<TaskTaskStatus, React.ReactNode> = {
  [TaskTaskStatus.COMPLETED]: <CircleCheck height={16} width={16} className="text-task-complete" />,
  [TaskTaskStatus.IN_PROGRESS]: <Timer height={16} width={16} className="text-task-in-progress" />,
  [TaskTaskStatus.IN_REVIEW]: <ScanEye height={16} width={16} className="text-task-in-review" />,
  [TaskTaskStatus.OPEN]: <Circle height={16} width={16} className="text-task-open" />,
  [TaskTaskStatus.WONT_DO]: <CircleOff height={16} width={16} className="text-task-wont-do" />,
}
