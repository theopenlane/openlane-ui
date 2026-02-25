import React, { useMemo } from 'react'

const SideNavigation = () => {
  const sections = useMemo(
    () => [
      { id: 'summary', label: 'Summary' },
      { id: 'modules', label: 'Modules' },
      { id: 'addons', label: 'Add-ons' },
      { id: 'billing-settings', label: 'Billing Settings' },
      { id: 'payment-method', label: 'Payment Method' },
      { id: 'recent-invoices', label: 'Recent Invoices' },
      { id: 'cancel-subscription', label: 'Cancel Subscription' },
    ],
    [],
  )

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {sections.map((s) => (
        <button key={s.id} onClick={() => handleScrollTo(s.id)} className={`text-left font-bold text-text-heading whitespace-nowrap bg-transparent px-1`}>
          {s.label}
        </button>
      ))}
    </div>
  )
}

export default SideNavigation
