// app/api/stripe/products/route.ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    // Get all products
    const products = await stripe.products.list({ active: true })
    // Get all prices
    const prices = await stripe.prices.list({ active: true })

    // Attach prices to the right product
    const productsWithPrices = products.data.map((product) => ({
      ...product,
      prices: prices.data.filter((price) => price.product === product.id),
    }))

    return NextResponse.json(productsWithPrices)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
