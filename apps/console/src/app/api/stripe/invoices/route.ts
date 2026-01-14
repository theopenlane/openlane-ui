import { auth } from '@/lib/auth/auth'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // ensure we have a valid session
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { customerId } = (await req.json()) as { customerId?: string }

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customerId' }, { status: 400 })
    }

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10,
    })

    const formatted = invoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount_paid: inv.amount_paid,
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
      created: inv.created,
    }))

    return NextResponse.json({ invoices: formatted })
  } catch (err: unknown) {
    console.error('❌ Stripe invoices error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
