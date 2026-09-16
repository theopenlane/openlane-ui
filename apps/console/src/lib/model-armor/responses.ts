import { NextResponse } from 'next/server'
import { modelArmorOutcome } from '@/lib/model-armor/errors'

export const modelArmorErrorResponse = (err: unknown): NextResponse | null => {
  const outcome = modelArmorOutcome(err)
  return outcome ? NextResponse.json({ error: outcome.message }, { status: outcome.status }) : null
}
