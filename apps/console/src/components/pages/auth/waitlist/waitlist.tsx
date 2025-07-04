'use client'

import { Logo } from '@repo/ui/logo'
import { Subscribe } from '@/components/pages/auth/subscribe/subscribe'
import Link from 'next/link'
import Github from '@/assets/Github'
import Discord from '@/assets/Discord'
import Linkedin from '@/assets/Linkedin'
import { OPENLANE_WEBSITE_URL } from '@/constants'

const Waitlist: React.FC = () => {
  return (
    <main className=" relative min-h-screen  w-full flex flex-col p-6 md:p-20">
      <div className="mb-8 flex">
        <Logo width={180} /> {/* Slightly smaller logo on mobile */}
      </div>
      <div className="flex flex-col md:flex-row relative gap-5 items-center">
        <div className="relative z-10 w-full md:max-w-lg self-start">
          <h1 className="text-4xl md:text-5xl font-normal leading-tight mb-4">
            Compliance should be <br className="hidden md:block" /> built-in, not bolted on
          </h1>

          <p className="mb-6 text-lg md:text-2xl max-w-lg ">Join the waitlist for our upcoming beta to ditch the spreadsheets and embrace the pipeline</p>

          <Subscribe />

          <div className="flex flex-col md:flex-row gap-3 mt-10">
            {/* GitHub */}
            <a href="https://github.com/theopenlane" target="_blank" rel="noopener noreferrer" className="bg-card flex items-center gap-3 px-2.5 py-1.5 rounded-lg border w-[162px] ">
              <Github size={30} />
              <div className="flex flex-col text-left text-sm leading-tight gap-1">
                <span>GitHub</span>
                <span className="text-blue-500">@theopenlane</span>
              </div>
            </a>

            {/* Discord */}
            <a href="https://discord.gg/4fq2sxDk7D" target="_blank" rel="noopener noreferrer" className="bg-card flex items-center gap-3 px-2.5 py-1.5 rounded-lg border w-[162px] ">
              <Discord size={30} />
              <div className="flex flex-col text-left text-sm leading-tight gap-1">
                <span>Discord</span>
                <span className="text-blue-500">Join community</span>
              </div>
            </a>

            {/* LinkedIn */}
            <a href="https://www.linkedin.com/company/theopenlane" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-2.5 py-1.5 rounded-lg border bg-card w-[162px] ">
              <Linkedin size={30} />
              <div className="flex flex-col text-left text-sm leading-tight gap-1">
                <span>LinkedIn</span>
                <span className="text-blue-500">@theopenlane</span>
              </div>
            </a>
          </div>

          <div className="mt-8 md:mt-12 text-xs space-x-4 ">
            <Link href={`${OPENLANE_WEBSITE_URL}/legal/privacy`}>Privacy Policy</Link>
            <Link href={`${OPENLANE_WEBSITE_URL}/legal/terms-of-service`}>Terms of Service</Link>
          </div>
        </div>

        <div className="max-w-xxl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hidden md:block " src="/icons/settings-bg.svg" alt="Background pattern" />
        </div>
      </div>
    </main>
  )
}

export default Waitlist
