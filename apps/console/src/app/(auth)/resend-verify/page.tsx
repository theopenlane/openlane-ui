'use client'

import { Resend } from '@/components/pages/auth/resend-verify/resend'

const ResendVerification: React.FC = () => {
  return (
    <main className="flex items-center justify-center h-screen relative">
      <div className="w-full relative z-3 px-4">
        <Resend />
      </div>
    </main>
  )
}

export default ResendVerification
