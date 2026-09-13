'use client'

import { useInvoicesQuery } from '@/lib/query-hooks/stripe'
import React from 'react'
import { formatDate } from '@/utils/date'
import { Button } from '@repo/ui/button'
import { type Invoice } from '@/types/stripe'
import { DownloadIcon } from 'lucide-react'
import { InvoiceRowSkeleton } from './skeleton/billing-page-skeleton'
import { InvoiceList, InvoiceRow } from './invoice-list'

const Invoices = ({ stripeCustomerId }: { stripeCustomerId: string | null | undefined }) => {
  const { data: invoicesData, isLoading, error } = useInvoicesQuery(stripeCustomerId)
  const invoices = invoicesData?.invoices ?? []
  const showEmptyState = !isLoading && !error && invoices.length === 0

  const handleManageBilling = async () => {
    const res = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: stripeCustomerId, isBillingSettings: true }),
    })

    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      console.error('❌ Portal error:', data.error)
    }
  }
  return (
    <div className="mt-10">
      <div className="flex justify-between items-center mb-4">
        <h2 id="recent-invoices" className="text-2xl">
          Recent Invoices
        </h2>
        {stripeCustomerId && (
          <Button className="h-8 p-2" onClick={handleManageBilling}>
            View all in stripe
          </Button>
        )}
      </div>
      <InvoiceList>
        {isLoading && (
          <>
            <InvoiceRowSkeleton />
            <InvoiceRowSkeleton />
            <InvoiceRowSkeleton />
          </>
        )}

        {error && <InvoiceRow className="justify-start text-sm text-destructive">Failed to load invoices</InvoiceRow>}

        {showEmptyState && <InvoiceRow className="justify-start text-sm">No invoices found</InvoiceRow>}

        {invoices.slice(0, 5).map((invoice: Invoice) => {
          const amountCents = invoice.status === 'paid' ? invoice.amount_paid : invoice.amount_due
          const amount = amountCents / 100
          const formattedDate = invoice.created ? formatDate(new Date(invoice.created * 1000).toISOString()) : ''

          return (
            <InvoiceRow key={invoice.id}>
              <div className="flex flex-col">
                <span className="font-medium">Invoice #{invoice.number || invoice.id}</span>
                <span className="text-xs text-text-informational">{formattedDate}</span>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-base">${amount.toFixed(2)}</span>

                {invoice.status === 'paid' && <span className="text-green-500 font-medium">Paid</span>}
                {invoice.status === 'open' && <span className="text-purple-400 font-medium">Pending</span>}

                {invoice.invoice_pdf && (
                  <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer" aria-label={`Download invoice ${invoice.number || invoice.id}`} className="hover:text-foreground">
                    <DownloadIcon size={16} />
                  </a>
                )}
              </div>
            </InvoiceRow>
          )
        })}
      </InvoiceList>
    </div>
  )
}

export default Invoices
