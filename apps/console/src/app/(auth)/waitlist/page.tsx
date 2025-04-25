'use client'

import { Logo } from '@repo/ui/logo'
import { Subscribe } from '@/components/pages/auth/subscribe/subscribe'
import Link from 'next/link'

const Waitlist: React.FC = () => {
  return (
    <main className=" relative min-h-screen w-full flex flex-col  p-20 overflow-hidden">
      <div className="mb-8 flex">
        <Logo theme="dark" width={213} />
      </div>
      <div className="flex">
        <div className="relative z-10 w-full max-w-lg ">
          <h1 className="text-5xl font-normal  leading-tight mb-4">
            Compliance should be <br /> built-in, not bolted on
          </h1>

          <p className="mb-6 text-2xl max-w-lg">Join the waitlist for our upcoming beta to ditch the spreadsheets and embrace the pipeline</p>

          <Subscribe />

          <div className="flex gap-3 mt-10">
            {/* GitHub */}
            <a href="https://github.com/theopenlane" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-2.5 py-1.5 rounded-lg border border bg-border w-60">
              <img src="/icons/github.svg" alt="GitHub" />
              <div className="flex flex-col text-left text-sm leading-tight gap-1 ">
                <span className="text-white">GitHub</span>
                <span className="text-blue-500">@theopenlane</span>
              </div>
            </a>

            {/* Discord */}
            <a href="https://discord.gg/4fq2sxDk7D" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-2.5 py-1.5 rounded-lg bg-border border  w-60">
              <img src="/icons/discord.svg" alt="Discord" />
              <div className="flex flex-col text-left text-sm leading-tight gap-1">
                <span className="text-white">Discord</span>
                <span className="text-blue-500">Join community</span>
              </div>
            </a>

            {/* LinkedIn */}
            <a href="https://www.linkedin.com/company/theopenlane" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-2.5 py-1.5 rounded-lg bg-border border  w-60">
              <img src="/icons/linkedin.svg" alt="LinkedIn" />
              <div className="flex flex-col text-left text-sm leading-tight gap-1">
                <span className="text-white">LinkedIn</span>
                <span className="text-blue-500">@theopenlane</span>
              </div>
            </a>
          </div>

          <div className="mt-12 text-xs space-x-4">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>

          <div className="text-xs  mt-20">
            This site is protected by reCAPTCHA and the Google <span>Privacy Policy</span> and <span>Terms of Service</span> apply.
          </div>
        </div>
        <img className="absolute right-0" src="/icons/settings-bg.svg" alt="Background pattern"></img>
      </div>
    </main>
  )
}

export default Waitlist
