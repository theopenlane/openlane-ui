'use client'
import LoginBackground from '@/assets/LoginBackground.tsx'
import Image from 'next/image'

const AuthMarketingPanel = ({ hideCopy }: { hideCopy?: boolean }) => {
  return (
    <div className="hidden lg:flex flex-col justify-center rounded-lg w-[560px] relative overflow-hidden">
      <div className="flex flex-col space-y-10 z-10 pl-[64px] pr-[64px]">
        {!hideCopy && (
          <>
            <span className="mb-0">
              “Openlane is the first compliance platform I&apos;ve used that truly understands how startups operate - and that includes their transparent and affordable pricing. The ability to tailor
              controls to the realities of a growing business instead of forcing a rigid checklist makes them an ideal partner for early-stage teams.”
            </span>

            <div className="flex items-center gap-4 mt-6">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-muted">
                <Image src="/images/priolo_nextgen.jpg" alt="Steve Priolo" width={48} height={48} className="object-cover" />
              </div>

              <div className="flex flex-col">
                <span className="font-medium text-sm text-foreground">Steve Priolo</span>
                <span className="text-sm text-muted-foreground font-normal">Priolo Nextgen Compliance</span>
              </div>
            </div>
          </>
        )}
      </div>

      <LoginBackground className="absolute right-0 bottom-[-170px] flex-shrink-0 opacity-50 text-svg-secondary" />
    </div>
  )
}

export default AuthMarketingPanel
