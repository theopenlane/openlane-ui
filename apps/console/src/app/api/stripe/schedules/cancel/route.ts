import { auth } from '@/lib/auth/auth'
import { stripe } from '@/lib/stripe'
import { ExtendedPhase } from '@/types/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // ensure we have a valid session
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { scheduleId } = (await req.json()) as { scheduleId?: string }

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId required' }, { status: 400 })
    }

    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)
    const currentPhase: ExtendedPhase = schedule.phases?.[0]
    if (!currentPhase) {
      return NextResponse.json({ error: 'No active phase found' }, { status: 404 })
    }

    const updated = await stripe.subscriptionSchedules.update(scheduleId, {
      end_behavior: 'cancel',
      phases: [
        {
          items: currentPhase.items.map((i) => ({
            price: i.price as string,
            quantity: i.quantity ?? 1,
          })),
          start_date: currentPhase.start_date,
          end_date: currentPhase.end_date,
          trial: currentPhase.trial,
        },
      ],
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('❌ Cancel subscription failed:', err)
    const message = err instanceof Error ? err.message : 'Cancel failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
