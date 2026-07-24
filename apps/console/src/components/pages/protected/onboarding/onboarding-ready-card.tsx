import { ArrowRight, Box, Server, ShieldAlert, Users } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const countArray = (value: unknown): number => (Array.isArray(value) ? value.length : 0)

export const domainScanStats = (data: unknown) => {
  const payload = isRecord(data) ? data : {}
  const assets = isRecord(payload.assets) ? payload.assets : {}
  const findings = isRecord(payload.findings) ? payload.findings : {}
  const agentReadiness = isRecord(findings.agent_readiness) ? findings.agent_readiness : undefined
  const hasAgentReadinessFinding = !!(agentReadiness?.checklist || agentReadiness?.level_name)

  return {
    systems: countArray(payload.systems),
    vendors: countArray(payload.vendors),
    assets: countArray(assets.dns_records) + countArray(assets.internal_domains) + countArray(assets.ip_addresses),
    findings: countArray(findings.risks) + countArray(findings.security_violations) + (hasAgentReadinessFinding ? 1 : 0),
  }
}

type OnboardingReadyCardProps = {
  totalSteps: number
  scanData: unknown
  hasScanReport: boolean
  primaryDomain?: string
  onReview: () => void
  onLeave: () => void
}

const OnboardingReadyCard = ({ totalSteps, scanData, hasScanReport, primaryDomain, onReview, onLeave }: OnboardingReadyCardProps) => {
  const stats = domainScanStats(scanData)

  return (
    <Card className="w-full min-h-96 p-7 md:p-8 shadow-lg rounded-xl">
      <div className="flex flex-col gap-3 mb-8 w-full">
        <Badge variant="primary" className="w-fit uppercase tracking-wide border-primary/24">
          Step {totalSteps} of {totalSteps}
        </Badge>
        <div className="relative h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-full bg-primary rounded-full" />
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">Your setup is ready</h2>
        <p className="text-sm text-text-light">
          {hasScanReport
            ? `We found systems, vendors, assets, and security findings for ${primaryDomain || 'your domain'}. Review and edit each section before adding it to Openlane.`
            : "We'll keep scanning in the background and notify you when your results are ready."}
        </p>
      </div>

      {hasScanReport && (
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3">What we found</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Server, count: stats.systems, label: 'systems' },
              { icon: Box, count: stats.assets, label: 'assets' },
              { icon: Users, count: stats.vendors, label: 'vendors' },
              { icon: ShieldAlert, count: stats.findings, label: 'findings' },
            ].map(({ icon: Icon, count, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-md border border-border p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon size={18} />
                </span>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold leading-none">{count}</span>
                  <span className="text-xs text-text-light">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasScanReport ? (
        <>
          <Button className="w-full" type="button" icon={<ArrowRight />} onClick={onReview}>
            Review what we found
          </Button>
          <button type="button" className="text-sm text-text-light mt-3 bg-transparent w-full text-center" onClick={onLeave}>
            Do this later
          </button>
        </>
      ) : (
        <Button className="w-full" type="button" icon={<ArrowRight />} onClick={onLeave}>
          Go to dashboard
        </Button>
      )}
    </Card>
  )
}

export default OnboardingReadyCard
