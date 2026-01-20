import { DnsVerificationDnsVerificationStatus } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import clsx from 'clsx'
import { BadgeCheck, CircleX, ExternalLink, Hourglass } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type UrlInputProps = {
  value: string
  onChange?: (v: string) => void
  disabled?: boolean
  className?: string
  verifiedStatus?: DnsVerificationDnsVerificationStatus | null
  hasCopyButton?: boolean
  placeholder?: string
}

function UrlInput({ value, onChange, disabled, className, verifiedStatus, hasCopyButton, placeholder }: UrlInputProps) {
  const isVerified = verifiedStatus === DnsVerificationDnsVerificationStatus.ACTIVE
  console.log('url input value with next link', value)
  return (
    <div className={clsx('flex items-center border rounded-md w-[490px]', className)}>
      <p className="px-3 py-2 text-sm select-none">https://</p>
      <Input className="rounded-none h-8" maxWidth value={value} placeholder={placeholder ?? 'meow.comply.theopenlane.net'} onChange={(e) => onChange?.(e.target.value)} disabled={disabled} />
      {hasCopyButton ? (
        // <a href={value} rel={'noreferrer'} target="_blank">
        //   <Button variant="secondary" className="flex items-center justify-center h-8 gap-1 rounded-l-none" icon={<ExternalLink size={14} />} disabled={!value} iconPosition="center"></Button>
        // </a>
        <Link href={value}>
          <Button variant="secondary" className="flex items-center justify-center h-8 gap-1 rounded-l-none" icon={<ExternalLink size={14} />} iconPosition="center"></Button>
        </Link>
      ) : (
        <div className="flex items-center ml-2 pr-3 whitespace-nowrap gap-1">
          {verifiedStatus !== undefined ? (
            <>
              {isVerified ? <BadgeCheck size={12} /> : <Hourglass size={12} />}
              <span className="font-normal text-sm leading-5">{isVerified ? 'Verified' : 'Pending'}</span>
            </>
          ) : (
            <>
              <CircleX size={12} />
              <span className="font-normal text-sm leading-5">Not set</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default UrlInput
