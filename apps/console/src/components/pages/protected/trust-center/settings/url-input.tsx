import { DnsVerificationDnsVerificationStatus } from '@repo/codegen/src/schema'
import { Input } from '@repo/ui/input'
import clsx from 'clsx'
import { BadgeCheck, CircleX, Hourglass } from 'lucide-react'
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
      {verifiedStatus !== undefined ? (
        <div className="flex items-center ml-2 pr-3 whitespace-nowrap gap-1">
          {isVerified ? <BadgeCheck size={12} /> : <Hourglass size={12} />}
          <span className="font-normal text-sm leading-5">{isVerified ? 'Verified' : 'Pending'}</span>
        </div>
      ) : (
        <div className="flex items-center ml-2 pr-3 whitespace-nowrap gap-1">
          <CircleX size={12} />
          <span className="font-normal text-sm leading-5">Not set</span>
        </div>
      )}
    </div>
  )
}

export default UrlInput
