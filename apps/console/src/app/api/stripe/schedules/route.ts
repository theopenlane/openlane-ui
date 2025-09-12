import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customerId' }, { status: 400 })
    }

    const schedules = await stripe.subscriptionSchedules.list({
      customer: customerId,
      limit: 10,
      expand: ['data.subscription'],
    })

    return NextResponse.json(schedules.data)
  } catch (err: any) {
    console.error('❌ Error fetching subscription schedules:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
