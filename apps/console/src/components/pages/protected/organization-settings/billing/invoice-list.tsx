import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { cn } from '@repo/ui/lib/utils'

type InvoiceDivProps = React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }

const InvoiceList = ({ className, ref, ...props }: InvoiceDivProps) => <Card ref={ref} className={cn('divide-y', className)} {...props} />

const InvoiceRow = ({ className, ref, ...props }: InvoiceDivProps) => <div ref={ref} className={cn('flex items-center justify-between py-4 px-6', className)} {...props} />

export { InvoiceList, InvoiceRow }
