import { auth } from '@/lib/auth/auth'
import { type Invoice } from '@/types/stripe'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

const DEFAULT_INVOICE_LIMIT = 10
const MAX_INVOICE_LIMIT = 100
const INVOICE_STATUSES: Stripe.InvoiceListParams.Status[] = ['draft', 'open', 'paid', 'uncollectible', 'void']

export async function POST(req: Request) {
  // ensure we have a valid session
  const session = await auth()
  if (!session || !session.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { customerId, status, limit } = (await req.json()) as { customerId?: string; status?: string; limit?: number }

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customerId' }, { status: 400 })
    }

    const requestedStatus = INVOICE_STATUSES.find((invoiceStatus) => invoiceStatus === status)

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: Math.min(Math.max(limit ?? DEFAULT_INVOICE_LIMIT, 1), MAX_INVOICE_LIMIT),
      ...(requestedStatus ? { status: requestedStatus } : {}),
    })

    const formatted: Invoice[] = invoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount_paid: inv.amount_paid,
      amount_due: inv.amount_due,
      hosted_invoice_url: inv.hosted_invoice_url ?? null,
      invoice_pdf: inv.invoice_pdf ?? null,
      created: inv.created,
      due_date: inv.due_date ?? null,
    }))

    return NextResponse.json({ invoices: formatted })
  } catch (err: unknown) {
    console.error('❌ Stripe invoices error:', err)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}
