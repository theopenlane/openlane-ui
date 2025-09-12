// /api/stripe/schedules/switch/route.ts
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { scheduleId, swaps } = await req.json()

    if (!scheduleId || !swaps?.length) {
      return NextResponse.json({ error: 'scheduleId and swaps[] are required' }, { status: 400 })
    }

    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)
    const currentPhase = schedule.current_phase
    if (!currentPhase) {
      return NextResponse.json({ error: 'Schedule has no current_phase' }, { status: 400 })
    }

    const phases = schedule.phases.map((phase) => ({
      start_date: phase.start_date,
      end_date: phase.end_date,
      currency: phase.currency,
      proration_behavior: phase.proration_behavior ?? 'create_prorations',
      add_invoice_items: (phase as any).add_invoice_items ?? [],
      items: phase.items.map((i) => ({
        price: typeof i.price === 'string' ? i.price : (i.price as any).id,
        quantity: i.quantity,
      })),
    }))

    const map: Record<string, string> = Object.fromEntries(swaps.map((s: { from: string; to: string }) => [s.from, s.to]))

    for (let i = 0; i < phases.length; i++) {
      phases[i].items = phases[i].items.map((it) => ({
        ...it,
        price: map[it.price] ?? it.price,
      }))
    }

    // try update
    try {
      const updated = await stripe.subscriptionSchedules.update(scheduleId, { phases })
      return NextResponse.json({ scheduleId, swaps, phases, updated })
    } catch (stripeErr: any) {
      return NextResponse.json(
        {
          error: stripeErr.message ?? 'Stripe update failed',
          debugPayload: { scheduleId, swaps, phases },
        },
        { status: 400 },
      )
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Switch failed' }, { status: 500 })
  }
}
