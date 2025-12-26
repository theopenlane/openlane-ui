'use client'

import { useInvoicesQuery } from '@/lib/query-hooks/stripe'
import React from 'react'
import { formatDate } from '@/utils/date'
import { Button } from '@repo/ui/button'
import { Invoice } from '@/types/stripe'
import { Card } from '@repo/ui/cardpanel'
import { DownloadIcon } from 'lucide-react'

const Invoices = ({ stripeCustomerId }: { stripeCustomerId: string | null | undefined }) => {
  const { data: invoicesData, isLoading, error } = useInvoicesQuery(stripeCustomerId)

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
      {/* Header */}
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
      {/* Invoices */}
      <Card>
        {isLoading && <p className="p-4 text-sm ">Loading invoices…</p>}

        {error && <p className="p-4 text-sm text-destructive">Failed to load invoices</p>}

        {!isLoading && !error && invoicesData?.invoices.length === 0 && <p className="p-4 text-sm ">No invoices found</p>}

        {invoicesData?.invoices.slice(0, 5).map((invoice: Invoice) => {
          const amount = (invoice.amount_paid || invoice.amount_due || 0) / 100
          const formattedDate = invoice.created ? formatDate(new Date(invoice.created * 1000).toISOString()) : ''

          return (
            <div key={invoice.id} className="flex items-center justify-between py-4 px-6 border-b first:border-none">
              {/* Left side */}
              <div className="flex flex-col">
                <span className="font-medium">Invoice #{invoice.number || invoice.id}</span>
                <span className="text-xs text-text-informational">{formattedDate}</span>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-6">
                <span className="text-base">${amount.toFixed(2)}</span>

                {invoice.status === 'paid' && <span className="text-green-500 font-medium">Paid</span>}
                {invoice.status === 'open' && <span className="text-purple-400 font-medium">Pending</span>}
                {invoice.status === 'overdue' && <span className="text-destructive font-medium">Overdue</span>}

                {invoice.invoice_pdf && (
                  <a href={invoice.invoice_pdf} className=" hover:text-white">
                    <DownloadIcon size={16} />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </Card>{' '}
    </div>
  )
}

export default Invoices
