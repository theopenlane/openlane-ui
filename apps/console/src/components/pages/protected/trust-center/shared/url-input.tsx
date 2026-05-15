import { DnsVerificationDnsVerificationStatus } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import clsx from 'clsx'
import { BadgeCheck, CircleX, ExternalLink, Hourglass } from 'lucide-react'
import React from 'react'

const BLOCKED_DOMAINS = ['theopenlane.net', 'example.com', 'example.net', 'example.org', 'localhost']

export function isBlockedDomain(value: string): boolean {
  const domain = value.toLowerCase().trim()
  return BLOCKED_DOMAINS.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`))
}

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
  const blocked = value ? isBlockedDomain(value) : false
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <div className={clsx('flex items-center border rounded-md w-full', blocked && 'border-red-500')}>
        <p className="px-3 py-2 text-sm select-none">https://</p>
        <Input className="rounded-none h-8" maxWidth value={value} placeholder={placeholder ?? 'trust.yourcompany.com'} onChange={(e) => onChange?.(e.target.value)} disabled={disabled} />
        {hasCopyButton ? (
          <a href={value} rel={'noreferrer'} target="_blank">
            <Button
              type="button"
              variant="secondary"
              className="flex items-center justify-center h-8 gap-1 rounded-l-none"
              icon={<ExternalLink size={14} />}
              disabled={!value}
              iconPosition="center"
            ></Button>
          </a>
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
      {blocked && <p className="text-red-500 text-xs">Enter a domain you own — theopenlane and reserved domains cannot be used as a vanity domain</p>}
    </div>
  )
}

export default UrlInput
