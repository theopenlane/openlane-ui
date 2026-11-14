'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@repo/ui/button'

type TIntegrationNotFoundProps = {
  message: string
  backHref?: string
  backLabel?: string
}

const IntegrationNotFound = ({ message, backHref = '/automation/integrations', backLabel = 'Back to Integrations' }: TIntegrationNotFoundProps) => (
  <div className="py-16 text-center text-muted-foreground">
    <p>{message}</p>
    <Button asChild variant="secondary" className="mt-4">
      <Link href={backHref}>{backLabel}</Link>
    </Button>
  </div>
)

export default IntegrationNotFound
