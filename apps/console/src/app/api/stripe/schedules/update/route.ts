import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

/**
 * Body:
 * {
 *   scheduleId: string,
 *   priceId: string,
 *   quantity?: number,
 *   action: "add" | "remove"
 * }
 */
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
    if (action === 'add' && !newPrice.recurring) {
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

    // Helper: fetch & memoize price data for cadence comparison
    const priceCache = new Map<string, Stripe.Price>()
    const getPrice = async (id: string) => {
      if (priceCache.has(id)) return priceCache.get(id)!
      const p = await stripe.prices.retrieve(id)
      priceCache.set(id, p)
      return p
    }

    // // Helper: verify cadence (interval, interval_count) + currency compatibility
    // const ensureCompatible = async (phase: any) => {
    //   // Currency check (if phase declares currency)
    //   if (phase.currency && newPrice.currency && phase.currency !== newPrice.currency) {
    //     throw new Error(`Currency mismatch for phase starting ${phase.start_date}: phase=${phase.currency}, newPrice=${newPrice.currency}`)
    //   }
    //   // Cadence check: compare against first existing item, if there is one
    //   if (phase.items.length > 0) {
    //     const basePriceId = phase.items[0].price
    //     const basePrice = await getPrice(basePriceId)
    //     if (!basePrice.recurring || !newPrice.recurring) {
    //       // if either is not recurring, fail here (we already guard above for add)
    //       throw new Error('Attempted to mix recurring and one-time items inside a phase')
    //     }
    //     const sameInterval = basePrice.recurring.interval === newPrice.recurring.interval && (basePrice.recurring.interval_count ?? 1) === (newPrice.recurring.interval_count ?? 1)
    //     const sameCurrency = basePrice.currency === newPrice.currency
    //     if (!sameInterval || !sameCurrency) {
    //       throw new Error(
    //         `Cadence mismatch in phase starting ${phase.start_date}: ` +
    //           `existing=${basePrice.recurring.interval}/${basePrice.recurring.interval_count || 1} ${basePrice.currency}, ` +
    //           `new=${newPrice.recurring.interval}/${newPrice.recurring.interval_count || 1} ${newPrice.currency}`,
    //       )
    //     }
    //   }
    // }

    if (action === 'add') {
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
