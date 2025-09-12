import { stripeSecretKey } from '@repo/dally/auth'
import Stripe from 'stripe'

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY in .env')
}

export const stripe = new Stripe(stripeSecretKey)
