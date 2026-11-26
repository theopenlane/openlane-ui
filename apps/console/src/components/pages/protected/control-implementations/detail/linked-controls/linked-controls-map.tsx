import { cn } from '@repo/ui/lib/utils'
import { CUSTOM_STANDARD_FILTER_VALUE } from '@/components/shared/table-filter/custom-standard-filter'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { type TFrameworkGroup, type TLinkedControlRow } from './linked-control-groups'
import { LinkedControlRef } from './linked-control-ref'
import { OtherImplementations } from './other-implementations'

const ROW_HEIGHT = 52
const CURVE_WIDTH = 40

type TLinkedControlsMapProps = {
  groups: TFrameworkGroup[]
  showOthers: boolean
}

const rowCenter = (index: number) => index * ROW_HEIGHT + ROW_HEIGHT / 2

const FrameworkConnectors = ({ rows }: { rows: TLinkedControlRow[] }) => {
  const height = rows.length * ROW_HEIGHT
  const start = height / 2
  const middle = CURVE_WIDTH / 2

  return (
    <svg width={CURVE_WIDTH} height={height} className="shrink-0 text-border" aria-hidden>
      {rows.map((row, index) =>
        row.isSubcontrol ? null : (
          <path key={row.id} d={`M0 ${start} C${middle} ${start} ${middle} ${rowCenter(index)} ${CURVE_WIDTH} ${rowCenter(index)}`} fill="none" stroke="currentColor" strokeWidth={1.5} />
        ),
      )}
    </svg>
  )
}

const SubcontrolConnector = ({ isLast }: { isLast: boolean }) => (
  <div className="relative w-6 shrink-0 self-stretch" aria-hidden>
    <div className={cn('absolute left-3 top-0 border-l', isLast ? 'h-1/2' : 'h-full')} />
    <div className="absolute left-3 right-0 top-1/2 border-t" />
  </div>
)

const MapRow = ({ row, isLastSubcontrol, showOthers }: { row: TLinkedControlRow; isLastSubcontrol: boolean; showOthers: boolean }) => (
  <div className="flex items-center" style={{ height: ROW_HEIGHT }}>
    <div className="flex h-full min-w-0 flex-1 items-center">
      {row.isSubcontrol && <SubcontrolConnector isLast={isLastSubcontrol} />}
      <div className={cn('flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-md border px-3 text-sm', row.href ? 'bg-card' : 'border-dashed bg-background text-muted-foreground')}>
        <LinkedControlRef row={row} />
        <span className="truncate" title={row.title ?? undefined}>
          {row.title}
        </span>
      </div>
    </div>
    {showOthers && (
      <div className="flex w-64 shrink-0 items-center">
        {row.others.items.length > 0 && (
          <>
            <div className="w-10 shrink-0 border-t" aria-hidden />
            <div className="flex h-9 min-w-0 flex-1 items-center rounded-md border bg-background px-3 text-sm">
              <OtherImplementations others={row.others} />
            </div>
          </>
        )}
      </div>
    )}
  </div>
)

export const LinkedControlsMap = ({ groups, showOthers }: TLinkedControlsMapProps) => (
  <div className="overflow-x-auto rounded-lg border">
    <div className={showOthers ? 'min-w-[680px]' : 'min-w-[420px]'}>
      <div className="flex border-b px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
        <span className="w-40 shrink-0">Framework</span>
        <span className="flex-1">Control</span>
        {showOthers && <span className="w-64 shrink-0 pl-10">Other Implementations</span>}
      </div>
      <div className="space-y-2 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[16px_16px] px-4 py-3">
        {groups.map(({ framework, rows }) => (
          <div key={framework} className="flex" role="group" aria-label={framework || CUSTOM_STANDARD_FILTER_VALUE}>
            <div className="relative flex w-40 shrink-0 items-center">
              <div className="absolute inset-x-0 top-1/2 border-t" aria-hidden />
              <div className="relative flex min-w-0 max-w-full pr-2">
                <StandardChip referenceFramework={framework} className="min-w-0 max-w-full shrink [&>:first-child]:shrink-0" truncate />
              </div>
            </div>
            <FrameworkConnectors rows={rows} />
            <div className="min-w-0 flex-1">
              {rows.map((row, index) => (
                <MapRow key={row.id} row={row} isLastSubcontrol={row.isSubcontrol && !rows[index + 1]?.isSubcontrol} showOthers={showOthers} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)
