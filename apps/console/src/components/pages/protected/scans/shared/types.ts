export type LinkableItem = { id: string; name: string; logoUrl?: string }

export type ScanSummaryItem = LinkableItem & { description?: string; linkedVendorNames?: string[] }

export type ScanSummarySection<TStepId extends string> = {
  stepId: TStepId
  title: string
  items: ScanSummaryItem[]
}
