import { Badge } from '@repo/ui/badge'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { RecordPreviewTable } from '@/components/shared/record-preview/record-preview-table'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { type TDemoDataType } from '@/constants/demo-data-types'
import { type TDemoDataPreviewNode, useDemoDataTypePreview } from '@/lib/graphql-hooks/demo-data'
import { getObjectDisplayName } from '@/utils/object-display-name'
import { pluralizeWithCount } from '@/utils/strings'

type DemoDataPreviewRowsProps = {
  type: TDemoDataType
  previewDocument: string
  total: number
}

type DemoDataTypePreviewProps = DemoDataPreviewRowsProps & {
  isKept: boolean
}

const RECOMMENDED_NOTE = 'Recommended: these are generic enough to adapt for your own program.'
const DEFAULT_NOTE = "These describe a fictional company, so they're usually removed."

const toName = (node: TDemoDataPreviewNode) => [getObjectDisplayName(node), node.refCode ? node.title : null].filter(Boolean).join(' ')

const toDetail = (type: TDemoDataType, { detail, field }: TDemoDataPreviewNode) => (type.isDetailFreeText ? (detail ?? '') : getEnumLabel([detail, field].filter(Boolean).join(' ')))

const DemoDataPreviewRows = ({ type, previewDocument, total }: DemoDataPreviewRowsProps) => {
  const { data, isPending, isError } = useDemoDataTypePreview(type, previewDocument)

  if (isError) return <p className="p-4 text-sm text-muted-foreground">We couldn&apos;t load these records. Please try again later.</p>

  if (isPending) {
    return (
      <div role="status" aria-live="polite" aria-label={`Loading ${type.label}`} className="flex flex-col gap-3 p-4">
        <Skeleton height={16} className="w-full max-w-[320px] rounded-md" />
        <Skeleton height={16} className="w-full max-w-[260px] rounded-md" />
        <Skeleton height={16} className="w-full max-w-[300px] rounded-md" />
      </div>
    )
  }

  return (
    <>
      <p className="px-4 pb-3 text-sm text-muted-foreground">
        Showing {data.length} of {pluralizeWithCount(total, 'record')}
      </p>
      <RecordPreviewTable headers={['Name', type.detailHeader]} rows={data.map((node) => [toName(node), toDetail(type, node)])} ariaLabel={`${type.label} sample records`} className="px-2" />
    </>
  )
}

export const DemoDataTypePreview = ({ type, previewDocument, total, isKept }: DemoDataTypePreviewProps) => (
  <section aria-label={`${type.label} preview`} className="flex min-h-0 min-w-0 flex-1 flex-col bg-card">
    <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1">
      <h3 className="text-sm font-medium">{type.label}</h3>
      <Badge variant={isKept ? 'green' : 'outline'}>{isKept ? 'Keeping' : 'Removing'}</Badge>
    </div>
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DemoDataPreviewRows key={type.key} type={type} previewDocument={previewDocument} total={total} />
    </div>
    <p className="border-t px-4 py-3 text-sm text-muted-foreground">
      {type.recommended ? RECOMMENDED_NOTE : DEFAULT_NOTE}
      {type.alsoKeeps && ` Keeping them also keeps ${type.alsoKeeps}.`}
    </p>
  </section>
)
