// app/api/stripe/schedules/cancel/route.ts
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { scheduleId } = await req.json()

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId required' }, { status: 400 })
    }

    const updated = await stripe.subscriptionSchedules.update(scheduleId, {
      end_behavior: 'cancel',
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('❌ Cancel subscription failed:', err)
    return NextResponse.json({ error: err.message ?? 'Cancel failed' }, { status: 500 })
  }
}
