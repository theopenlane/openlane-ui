'use client'

import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Badge } from '@repo/ui/badge'
import { Info, Circle } from 'lucide-react'
import { useGetRiskById } from '@/lib/graphql-hooks/risks'
import { ControlEdge, Risk } from '@repo/codegen/src/schema'
import { Loading } from '@/components/shared/loading/loading'
import { RiskLabel } from './risk-label'

const FieldRow = ({ label, children }: { label: string; children?: React.ReactNode }) => (
  <>
    <div className="flex gap-1 items-center">
      <Circle className="text-brand" size={16} />
      <div className="text-muted-foreground">{label}</div>
    </div>
    <div className="flex gap-1 text-sm">{children}</div>
  </>
)

const RiskDetailsSheet = () => {
  const searchParams = useSearchParams()
  const router = useRouter()

  const riskId = searchParams.get('id')
  const { data, isPending } = useGetRiskById(riskId)

  const handleSheetClose = () => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('id')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
  }

  const risk = data?.risk as Risk
  if (!risk) return null

  const { name, riskType, category, score, impact, likelihood, status, tags, details, businessCosts, controls, mitigation } = risk

  return (
    <Sheet open={!!riskId} onOpenChange={handleSheetClose}>
      <SheetContent className="bg-card overflow-y-auto">
        {isPending ? (
          <Loading />
        ) : (
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>{name || 'Unnamed Risk'}</SheetTitle>
            </SheetHeader>

            <div className="grid grid-cols-[160px_1fr] gap-y-3 text-sm mt-6">
              <FieldRow label="Type">{riskType}</FieldRow>
              <FieldRow label="Category">{category}</FieldRow>
              <FieldRow label="Score">{score && <RiskLabel score={score} />}</FieldRow>
              <FieldRow label="Impact">{impact && <RiskLabel impact={impact} />}</FieldRow>
              <FieldRow label="Likelihood">{likelihood && <RiskLabel likelihood={likelihood} />}</FieldRow>
              <FieldRow label="Status">{status && <RiskLabel status={status} />}</FieldRow>
              <FieldRow label="Tags">
                <div className="flex flex-wrap gap-2">
                  {tags?.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs lowercase">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </FieldRow>
            </div>

            {details && (
              <div>
                <h4 className=" font-semibold mb-1 text-header">Details</h4>
                <p className="text-sm whitespace-pre-wrap">{details}</p>
              </div>
            )}

            {mitigation && (
              <div>
                <h4 className=" font-semibold mb-1 text-header">Mitigation</h4>
                <p className="text-sm whitespace-pre-wrap">{mitigation}</p>
              </div>
            )}

            {businessCosts && (
              <div>
                <h4 className=" font-semibold mb-1 text-header">Business costs</h4>
                <p className="text-sm whitespace-pre-wrap">{businessCosts}</p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default RiskDetailsSheet
