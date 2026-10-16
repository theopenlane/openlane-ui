import { stripeSecretKey } from '@repo/dally/auth'
import Stripe from 'stripe'

let client: Stripe | undefined

// Created on first use rather than at import, so building or loading a route (e.g. `next build`
// collecting page data) doesn't require STRIPE_SECRET_KEY; only an actual Stripe call does
export const getStripe = (): Stripe => {
  if (!stripeSecretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY in .env')
  }

  client ??= new Stripe(stripeSecretKey)

  return client
}
