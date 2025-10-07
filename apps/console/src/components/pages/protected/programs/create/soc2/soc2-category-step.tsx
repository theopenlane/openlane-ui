'use client'
import React from 'react'
import { Button } from '@repo/ui/button'

export default function SOC2CategoryStep() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Pick Trust Service Categories</h2>
        <p className="text-sm text-muted-foreground">Security is always required. Add others now or later.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {['Availability', 'Confidentiality', 'Processing Integrity', 'Privacy'].map((item) => (
          <Button key={item} type="button" className=" text-left h-11 ">
            {item}
          </Button>
        ))}
      </div>
    </div>
  )
}
