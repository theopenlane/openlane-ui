import { DnsVerificationDnsVerificationStatus } from '@repo/codegen/src/schema'
import { Input } from '@repo/ui/input'
import clsx from 'clsx'
import { BadgeCheck, Hourglass } from 'lucide-react'
import React from 'react'

type UrlInputProps = {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  className?: string
  verifiedStatus?: DnsVerificationDnsVerificationStatus | null
}

function UrlInput({ value, onChange, disabled, className, verifiedStatus }: UrlInputProps) {
  const isVerified = verifiedStatus === DnsVerificationDnsVerificationStatus.active

  return (
    <div className={clsx('flex items-center border rounded-md w-[490px]', className)}>
      <p className="px-3 py-2 text-sm select-none">https://</p>
      <Input className="rounded-none" maxWidth value={value} placeholder="subdomain.domain.com" onChange={(e) => onChange(e.target.value)} disabled={disabled} />
      {verifiedStatus !== undefined && (
        <div className="flex items-center mx-2 pr-3">
          {isVerified ? <BadgeCheck /> : <Hourglass />}
          <span className=" font-normal text-sm leading-5 ml-2">{isVerified ? 'Verified' : 'Pending'}</span>
        </div>
      )}
    </div>
  )
}

export default UrlInput
