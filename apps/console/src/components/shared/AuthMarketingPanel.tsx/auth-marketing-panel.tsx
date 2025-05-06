import { Logo } from '@repo/ui/logo'
import React from 'react'

const AuthMarketingPanel = () => {
  return (
    <div className="hidden bg-auth lg:flex flex-col justify-center w-full max-w-lg  p-10 mt-[18px] mr-[0px] mb-[25px] ml-[19px] rounded-lg flex-1">
      <div className="flex flex-col space-y-10 ml-5">
        <Logo asIcon width={50} />
        <h2 className="text-4xl font-normal ">
          Checkboxes don’t
          <br /> build trust. We do.
        </h2>
      </div>
    </div>
  )
}

export default AuthMarketingPanel
