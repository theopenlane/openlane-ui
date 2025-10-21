'use client'
import LoginBackground from '@/assets/LoginBackground.tsx'

const AuthMarketingPanel = () => {
  return (
    <div className="hidden lg:flex flex-col justify-center rounded-lg w-2/5 w-[560px] relative overflow-hidden">
      <div className="flex flex-col space-y-10 z-10 pl-[64px] pr-[64px]">
        “Openlane makes compliance effortless. What used to take us weeks of manual work now happens automatically—and the dashboards give our team total visibility.”
      </div>
      <LoginBackground className="absolute right-0 top-[645px] bottom-0 flex-shrink-0 opacity-50 " />
    </div>
  )
}

export default AuthMarketingPanel
