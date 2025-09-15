import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { scheduleId, priceId, quantity = 1, action } = await req.json()

    if (!scheduleId || !priceId || !action) {
      return NextResponse.json({ error: 'scheduleId, priceId and action are required' }, { status: 400 })
    }

    // 1) Fetch schedule + the price you want to add/remove
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)
    const newPrice = await stripe.prices.retrieve(priceId)

    // One-time prices should not be added to schedule items (per your doc note)
    if (action === 'subscribe' && !newPrice.recurring) {
      return NextResponse.json({ error: 'This endpoint only supports recurring prices. One-time prices should be billed immediately as invoice items.' }, { status: 400 })
    }

    // Build normalized phases from GET payload
    const rawPhases = schedule.phases || []
    const currentPhase = schedule.current_phase
    if (!currentPhase) {
      return NextResponse.json({ error: 'Schedule has no current_phase' }, { status: 400 })
    }

    // Find current phase index (strict match by dates, as in your doc)
    const currentIdx = rawPhases.findIndex((p) => p.start_date === currentPhase.start_date && p.end_date === currentPhase.end_date)
    const phases = rawPhases.map((phase) => {
      const normalized: any = {
        start_date: phase.start_date,
        end_date: phase.end_date,
        currency: phase.currency, // useful for quick currency check
        proration_behavior: phase.proration_behavior ?? 'create_prorations',
        add_invoice_items: (phase as any).add_invoice_items ?? [],
        items: phase.items.map((i) => ({
          price: typeof i.price === 'string' ? i.price : (i.price as any).id,
          quantity: i.quantity,
        })),
      }

      // keep exactly one of trial / trial_end (Stripe error if both)
      if (phase.trial_end) {
        normalized.trial_end = phase.trial_end
      } else if ((phase as any).trial) {
        normalized.trial = true
      }

      return normalized
    })

    if (currentIdx === -1) {
      return NextResponse.json({ error: 'Unable to identify current phase in phases[]' }, { status: 400 })
    }

    if (action === 'subscribe') {
      // Add to current + all future phases
      for (let i = currentIdx; i < phases.length; i++) {
        const phase = phases[i]
        // await ensureCompatible(phase)

        const exists = phase.items.some((it: any) => it.price === priceId)
        if (!exists) {
          phase.items.push({ price: priceId, quantity })
        }
      }
    } else if (action === 'remove') {
      const hasFuture = currentIdx < phases.length - 1

      if (hasFuture) {
        // Remove from future phases only (leave current intact)
        for (let i = currentIdx + 1; i < phases.length; i++) {
          phases[i].items = phases[i].items.filter((it: any) => it.price !== priceId)
        }
      } else {
        // No future phase -> create one that starts at current_phase.end_date
        const lastPhase = phases[phases.length - 1]
        const newItems = lastPhase.items.filter((it: any) => it.price !== priceId)

        if (newItems.length === 0) {
          return NextResponse.json({ error: 'Removing this item would leave the future phase empty. If you intend to cancel, use a cancel flow.' }, { status: 400 })
        }

        phases.push({
          start_date: currentPhase.end_date,
          // no end_date → becomes ongoing
          currency: lastPhase.currency,
          proration_behavior: 'create_prorations',
          items: newItems,
          add_invoice_items: lastPhase.add_invoice_items ?? [],
          // No trial here
        })
      }
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "add" or "remove".' }, { status: 400 })
    }

    // 4) Update schedule with the full phases array
    const updated = await stripe.subscriptionSchedules.update(scheduleId, { phases })
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('❌ Failed to update schedule:', err)
    return NextResponse.json({ error: err.message ?? 'Schedule update failed' }, { status: 500 })
  }
}
