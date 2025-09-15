//PRODUCTS
type BillingPrice = {
  interval: 'month' | 'year'
  unit_amount: number
  nickname: string
  lookup_key: string
  price_id: string
  metadata?: Record<string, string>
}

type Billing = {
  prices: BillingPrice[]
}

interface Module {
  display_name: string
  lookup_key: string
  description: string
  marketing_description?: string
  billing: Billing
  audience: 'public' | 'private' | 'beta'
  product_id: string
  personal_org?: boolean
  include_with_trial?: boolean
  usage?: {
    evidence_storage_gb?: number
  }
}

interface Addon {
  display_name: string
  lookup_key: string
  description: string
  marketing_description?: string
  billing: Billing
  audience: 'public' | 'private' | 'beta'
  product_id: string
}

export interface OpenlaneProductsResponse {
  success: boolean
  version: string
  sha: string
  modules: Record<string, Module>
  addons: Record<string, Addon>
}
//SCHEDULES
// ---- Stripe Subscription Schedule Types ----

export interface SubscriptionSchedule {
  id: string
  object: 'subscription_schedule'
  application: string | null
  billing_mode: {
    type: 'classic' | string // fallback for future Stripe values
  }
  canceled_at: number | null
  completed_at: number | null
  created: number // unix timestamp
  current_phase: {
    start_date: number
    end_date: number
  } | null
  customer: string // customer ID
  default_settings: ScheduleDefaultSettings
  end_behavior: 'release' | 'cancel' | 'renew' | string
  livemode: boolean
  metadata: Record<string, string>
  phases: SchedulePhase[]
  released_at: number | null
  released_subscription: string | null
  renewal_interval: string | null
  status: 'not_started' | 'active' | 'released' | 'completed' | 'canceled'
  subscription: Subscription | null
  test_clock: string | null
}

export interface ScheduleDefaultSettings {
  application_fee_percent: number | null
  automatic_tax: {
    disabled_reason: string | null
    enabled: boolean
    liability: string | null
  }
  billing_cycle_anchor: 'automatic' | string
  billing_thresholds: unknown | null
  collection_method: 'charge_automatically' | 'send_invoice'
  default_payment_method: string | null
  default_source: string | null
  description: string | null
  invoice_settings: {
    account_tax_ids: string[] | null
    days_until_due: number | null
    issuer: {
      type: 'self' | 'account'
    }
  }
  on_behalf_of: string | null
  transfer_data: unknown | null
}

export interface SchedulePhase {
  add_invoice_items: unknown[]
  application_fee_percent: number | null
  billing_cycle_anchor: number | null
  billing_thresholds: unknown | null
  collection_method: string | null
  currency: string
  default_payment_method: string | null
  default_tax_rates: string[]
  description: string | null
  discounts: string[]
  end_date: number
  invoice_settings: unknown | null
  items: SchedulePhaseItem[]
  metadata: Record<string, string>
  on_behalf_of: string | null
  proration_behavior: 'create_prorations' | 'none' | string
  start_date: number
  transfer_data: unknown | null
  trial?: boolean
  trial_end?: number | null
}

export interface SchedulePhaseItem {
  billing_thresholds: unknown | null
  discounts: string[]
  metadata: Record<string, string>
  plan: string
  price: string
  quantity: number
  tax_rates: string[]
}

// ---- Embedded Subscription ----

export interface Subscription {
  id: string
  object: 'subscription'
  application: string | null
  application_fee_percent: number | null
  automatic_tax: {
    disabled_reason: string | null
    enabled: boolean
    liability: string | null
  }
  billing_cycle_anchor: number
  billing_cycle_anchor_config: unknown | null
  billing_mode: {
    type: 'classic' | string
  }
  billing_thresholds: unknown | null
  cancel_at: number | null
  cancel_at_period_end: boolean
  canceled_at: number | null
  cancellation_details: {
    comment: string | null
    feedback: string | null
    reason: string | null
  }
  collection_method: 'charge_automatically' | 'send_invoice'
  created: number
  currency: string
  customer: string
  days_until_due: number | null
  default_payment_method: string | null
  default_source: string | null
  default_tax_rates: string[]
  description: string | null
  discounts: string[]
  ended_at: number | null
  invoice_settings: {
    account_tax_ids: string[] | null
    issuer: {
      type: 'self' | 'account'
    }
  }
  items: {
    object: 'list'
    data: SubscriptionItem[]
    has_more: boolean
    total_count: number
    url: string
  }
  latest_invoice: string | null
  livemode: boolean
  metadata: Record<string, string>
  next_pending_invoice_item_invoice: string | null
  on_behalf_of: string | null
  pause_collection: unknown | null
  payment_settings: {
    payment_method_options: unknown | null
    payment_method_types: string[] | null
    save_default_payment_method: 'on_subscription' | 'off_subscription'
  }
  pending_invoice_item_interval: unknown | null
  pending_setup_intent: string | null
  pending_update: unknown | null
  plan: unknown | null
  quantity: number | null
  schedule: string | null
  start_date: number
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | string
  test_clock: string | null
  transfer_data: unknown | null
  trial_end: number | null
  trial_settings: {
    end_behavior: {
      missing_payment_method: 'cancel' | string
    }
  }
  trial_start: number | null
}

export interface SubscriptionItem {
  id: string
  object: 'subscription_item'
  billing_thresholds: unknown | null
  created: number
  current_period_end: number
  current_period_start: number
  discounts: string[]
  metadata: Record<string, string>
  plan: Plan
  price: Price
  quantity: number
  subscription: string
  tax_rates: string[]
}

export interface Plan {
  id: string
  object: 'plan'
  active: boolean
  amount: number
  amount_decimal: string
  billing_scheme: 'per_unit' | string
  created: number
  currency: string
  interval: 'day' | 'week' | 'month' | 'year'
  interval_count: number
  livemode: boolean
  metadata: Record<string, string>
  meter: string | null
  nickname: string
  product: string
  tiers_mode: string | null
  transform_usage: string | null
  trial_period_days: number | null
  usage_type: 'licensed' | 'metered' | string
}

export interface Price {
  id: string
  object: 'price'
  active: boolean
  billing_scheme: 'per_unit' | 'tiered'
  created: number
  currency: string
  custom_unit_amount: number | null
  livemode: boolean
  lookup_key: string
  metadata: Record<string, string>
  nickname: string
  product: string
  recurring: {
    interval: 'day' | 'week' | 'month' | 'year'
    interval_count: number
    meter: string | null
    trial_period_days: number | null
    usage_type: 'licensed' | 'metered' | string
  }
  tax_behavior: 'inclusive' | 'exclusive' | 'unspecified'
  tiers_mode: string | null
  transform_quantity: string | null
  type: 'recurring' | 'one_time'
  unit_amount: number
  unit_amount_decimal: string
}

// ---- API response ----

export type SubscriptionSchedulesResponse = SubscriptionSchedule[]
