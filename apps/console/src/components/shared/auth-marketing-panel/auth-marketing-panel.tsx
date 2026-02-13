import Image from 'next/image'
import CustomerQuoteSection from '../customer-quote-section/customer-quote-section'
import { CUSTOMER_QUOTES } from './auth-marketing-panel-config'

const AuthMarketingPanel = ({ hideCopy }: { hideCopy?: boolean }) => {
  const index = Math.floor(Math.random() * CUSTOMER_QUOTES.length)

  return (
    <div className="hidden lg:flex flex-col justify-center rounded-lg w-[560px] relative overflow-hidden">
      <div className="flex flex-col space-y-10 z-10 px-16">{!hideCopy && <CustomerQuoteSection comment={CUSTOMER_QUOTES[index]}></CustomerQuoteSection>}</div>
      <Image
        src="/icons/login-dots-gradient.webp"
        alt=""
        width={803}
        height={822}
        priority
        aria-hidden
        className="absolute right-0 bottom-0 w-auto shrink-0 max-w-none pointer-events-none select-none dark:hidden"
      />
      <Image
        src="/icons/login-dots-gradient-dark.webp"
        alt=""
        width={803}
        height={822}
        priority
        aria-hidden
        className="absolute right-0 bottom-0 hidden w-auto shrink-0 max-w-none pointer-events-none select-none dark:block"
      />
    </div>
  )
}

export default AuthMarketingPanel
