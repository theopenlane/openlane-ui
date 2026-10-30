import type Stripe from 'stripe'
import { LIVE_STATUSES, isLive, pickLiveSubscription } from './live-subscription'

const sub = (status: Stripe.Subscription.Status, id = `sub_${status}`, customer: Stripe.Subscription['customer'] = 'cus_1') => ({ id, status, customer }) as Stripe.Subscription

describe('isLive', () => {
  it('treats a subscription that still owes access as live', () => {
    for (const status of ['active', 'trialing', 'past_due', 'unpaid', 'paused', 'incomplete'] as Stripe.Subscription.Status[]) {
      expect(isLive(sub(status))).toBe(true)
    }
  })

  it('treats a finished subscription as not live', () => {
    for (const status of ['canceled', 'incomplete_expired'] as Stripe.Subscription.Status[]) {
      expect(isLive(sub(status))).toBe(false)
    }
  })

  it('keeps past_due live so a delinquent org still reaches its billing page', () => {
    expect(isLive(sub('past_due'))).toBe(true)
  })
})

describe('pickLiveSubscription', () => {
  it('returns null when the customer has no subscription at all', () => {
    expect(pickLiveSubscription([])).toBeNull()
  })

  it('returns null when every subscription has finished', () => {
    expect(pickLiveSubscription([sub('canceled'), sub('incomplete_expired')])).toBeNull()
  })

  it('returns a past_due subscription rather than nothing, which was the reported defect', () => {
    expect(pickLiveSubscription([sub('past_due')])?.id).toBe('sub_past_due')
  })

  it('ignores canceled subscriptions when a past_due one exists', () => {
    expect(pickLiveSubscription([sub('canceled'), sub('past_due')])?.id).toBe('sub_past_due')
  })

  it('prefers active over every other live status', () => {
    expect(pickLiveSubscription([sub('incomplete'), sub('past_due'), sub('active'), sub('trialing')])?.id).toBe('sub_active')
  })

  it('prefers trialing over the delinquent statuses', () => {
    expect(pickLiveSubscription([sub('unpaid'), sub('trialing'), sub('paused')])?.id).toBe('sub_trialing')
  })

  it('orders the delinquent statuses past_due, unpaid, paused, incomplete', () => {
    expect(pickLiveSubscription([sub('incomplete'), sub('paused'), sub('unpaid'), sub('past_due')])?.id).toBe('sub_past_due')
    expect(pickLiveSubscription([sub('incomplete'), sub('paused'), sub('unpaid')])?.id).toBe('sub_unpaid')
    expect(pickLiveSubscription([sub('incomplete'), sub('paused')])?.id).toBe('sub_paused')
    expect(pickLiveSubscription([sub('incomplete')])?.id).toBe('sub_incomplete')
  })

  it('does not depend on the order stripe returned them in', () => {
    const forward = pickLiveSubscription([sub('active'), sub('past_due')])?.id
    const reversed = pickLiveSubscription([sub('past_due'), sub('active')])?.id
    expect(forward).toBe('sub_active')
    expect(reversed).toBe('sub_active')
  })

  it('does not mutate the caller list', () => {
    const list = [sub('past_due'), sub('active')]
    pickLiveSubscription(list)
    expect(list.map((entry) => entry.id)).toEqual(['sub_past_due', 'sub_active'])
  })

  it('ranks every live status ahead of none, in the declared order', () => {
    expect(LIVE_STATUSES).toEqual(['active', 'trialing', 'past_due', 'unpaid', 'paused', 'incomplete'])
  })
})
