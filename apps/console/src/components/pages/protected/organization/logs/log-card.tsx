import React from 'react'
import { FilePenLine, ArrowRight, ChevronDown } from 'lucide-react'
import { AuditLog, User } from '@repo/codegen/src/schema.ts'
import { Card } from '@repo/ui/cardpanel'
import { formatDateTime } from '@/utils/date.ts'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { Avatar } from '@/components/shared/avatar/avatar'
import { AuditLogOperator, AuditLogOperatorMapper } from '@/components/shared/icon-enum/audit-log-enum.tsx'

type TLogCardProps = {
  log: AuditLog
  user?: User
}

const LogCardComponent = ({ log, user }: TLogCardProps) => {
  const { convertToReadOnly } = usePlateEditor()

  const getOperation = (operation?: string) => {
    if (!operation) {
      return ''
    }

    return operation.charAt(0).toUpperCase() + operation.slice(1).toLowerCase()
  }

  return (
    <Card className="w-full">
      <div className="px-4 py-4">
        <div className="flex">
          <div className="w-[40px] flex justify-center">
            <Avatar variant="medium" entity={user} />
          </div>

          <div className="flex-1 pl-4 space-y-3">
            <div>
              <div className="flex items-center gap-4">
                <p className="font-medium text-base">{user?.displayName}</p>
                <p className="font-normal text-base flex items-center gap-1">
                  {log.operation && (
                    <>
                      {AuditLogOperatorMapper[log.operation as keyof typeof AuditLogOperator]}
                      {getOperation(log?.operation)}
                    </>
                  )}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">ID: {log.id}</p>
            </div>

            <div className="text-sm">
              <div className="flex justify-between">
                <p className="text-sm">
                  {log.operation && getOperation(log.operation)}: {log.id}
                </p>
              </div>
              <div className="flex justify-between py-1">
                <p className="text-sm">{formatDateTime(log.time)}</p>
              </div>
              <div className="flex justify-between py-1">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="audit-logs">
                    <AccordionTrigger className="py-2 flex justify-between items-center gap-2 group border rounded-md p-3 bg-background-secondary">
                      <span className="text-sm">Show details</span>
                      <ChevronDown className="h-4 w-4 group-data-[state=open]:rotate-180" />
                    </AccordionTrigger>

                    <AccordionContent className="my-3 border-none">
                      {log.changes?.map((item, index) => (
                        <div key={index} className="grid [grid-template-columns:10%_90%] text-sm py-1 border-b last:border-b-0">
                          <p className="font-medium">{item.FieldName}</p>
                          <div className="flex items-center gap-1 text-muted-foreground flex-wrap">
                            {item.FieldName === 'details' ? <div>{convertToReadOnly(item.New, 0)}</div> : <span>{item.New}</span>}
                            <ArrowRight size={16} className="text-accent-secondary" />
                            {item.FieldName === 'details' ? <div>{convertToReadOnly(item.Old, 0)}</div> : <span>{item.Old}</span>}
                          </div>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

const LogCard = React.memo(LogCardComponent)
LogCard.displayName = 'LogCard'

export default LogCard
