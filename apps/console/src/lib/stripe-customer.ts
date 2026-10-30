import type Stripe from 'stripe'

type TCustomerRef = string | Stripe.Customer | Stripe.DeletedCustomer | null

export const belongsToCustomer = (resource: { customer: TCustomerRef }, customerId: string) =>
  !!resource.customer && (typeof resource.customer === 'string' ? resource.customer : resource.customer.id) === customerId
