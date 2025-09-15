import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

export async function GET() {
  try {
    const products: Stripe.ApiList<Stripe.Product> = await stripe.products.list({ active: true, limit: 100 })
    const prices: Stripe.ApiList<Stripe.Price> = await stripe.prices.list({ active: true, limit: 100 })

    const productsWithPrices = products.data.map((product) => ({
      ...product,
      prices: prices.data.filter((price) => price.product === product.id),
    }))

    return NextResponse.json(productsWithPrices)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch products'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
