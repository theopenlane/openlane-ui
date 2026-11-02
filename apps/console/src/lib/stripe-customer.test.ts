import type Stripe from 'stripe'
import { belongsToCustomer } from './stripe-customer'

const withCustomer = (customer: Stripe.Subscription['customer']) => ({ customer }) as Stripe.Subscription

describe('belongsToCustomer', () => {
  it('matches a customer given as an id string', () => {
    expect(belongsToCustomer(withCustomer('cus_1'), 'cus_1')).toBe(true)
    expect(belongsToCustomer(withCustomer('cus_1'), 'cus_2')).toBe(false)
  })

  it('matches a customer given as an expanded object', () => {
    const expanded = { id: 'cus_1' } as Stripe.Customer
    expect(belongsToCustomer(withCustomer(expanded), 'cus_1')).toBe(true)
    expect(belongsToCustomer(withCustomer(expanded), 'cus_2')).toBe(false)
  })

  it('does not match a deleted customer belonging to someone else', () => {
    const deleted = { id: 'cus_other', deleted: true } as Stripe.DeletedCustomer
    expect(belongsToCustomer(withCustomer(deleted), 'cus_1')).toBe(false)
  })
})
