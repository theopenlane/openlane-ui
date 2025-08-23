import { Input } from '@repo/ui/input'
import clsx from 'clsx'
import React from 'react'

type UrlInputProps = {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  className?: string
  verified?: boolean
}

function UrlInput({ value, onChange, disabled, className, verified }: UrlInputProps) {
  return (
    <div className={clsx('flex items-center border rounded-md w-[490px]', className)}>
      <div className="px-3 py-2 text-sm select-none">https://</div>
      <div className="w-[1px] border-l py-2"></div>
      <Input maxWidth value={value} placeholder="subdomain.domain.com" onChange={(e) => onChange(e.target.value)} className="border-none" disabled={disabled} />
      {verified && (
        <div className="flex items-center justify-end opacity-50 pr-3">
          <div className="h-2 w-2 rounded bg-brand mr-1"></div>
          <span className="font-normal text-xs">Verified</span>
        </div>
      )}
    </div>
  )
}

export default UrlInput
