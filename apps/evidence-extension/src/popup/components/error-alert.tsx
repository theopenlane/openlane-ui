import type { ReactNode } from 'react'
import { Alert, AlertDescription } from '@repo/ui/alert'

export const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

export const ErrorAlert = ({ children }: { children: ReactNode }) => (
  <Alert variant="destructive" className="p-3">
    <AlertDescription>{children}</AlertDescription>
  </Alert>
)
