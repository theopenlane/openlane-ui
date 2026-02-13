'use client'
import { useState } from 'react'
import LoginBackground from '@/assets/LoginBackground.tsx'
import CustomerQuoteSection from '../customer-quote-section/customer-quote-section'
import { useGetCustomerQuotes } from './auth-marketing-panel-config'

const AuthMarketingPanel = ({ hideCopy }: { hideCopy?: boolean }) => {
  const customerQuotes = useGetCustomerQuotes()
  const [index] = useState(Math.floor(Math.random() * customerQuotes.length))

  return (
    <div className="hidden lg:flex flex-col justify-center rounded-lg w-[560px] relative overflow-hidden">
      <div className="flex flex-col space-y-10 z-10 px-16">
        {!hideCopy && (
          <>
            <CustomerQuoteSection comment={customerQuotes[index]}></CustomerQuoteSection>
          </>
        )}
      </div>

      <LoginBackground className="absolute right-0 bottom-[-170px] shrink-0 opacity-50 text-svg-secondary" />
    </div>
  )
}

export default AuthMarketingPanel
