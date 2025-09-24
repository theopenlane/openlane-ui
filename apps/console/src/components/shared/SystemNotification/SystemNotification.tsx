'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, CheckCircle2, XCircle, Loader2, AlertTriangle, CheckCheck, Download } from 'lucide-react'
import { TJob, useTrackedExports } from '@/components/shared/export/use-tracked-export.ts'
import { ExportExportStatus } from '@repo/codegen/src/schema'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

const cx = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ')

const STATUS_COLORS = {
  running: '#3b82f6',
  success: '#22c55e',
  error: '#f43f5e',
  pending: '#fbbf24',
  warning: '#f97316',
  bell: {
    idle: '#9ca3af',
    active: '#3b82f6',
    success: '#22c55e',
    error: '#f43f5e',
  },
  bellBadge: {
    idle: '#6b7280',
    active: '#2563eb',
    success: '#16a34a',
    error: '#ef4444',
  },
}

function mapStatus(status: ExportExportStatus): 'running' | 'success' | 'error' | 'pending' | 'warning' {
  switch (status) {
    case ExportExportStatus.PENDING:
      return 'running'
    case ExportExportStatus.READY:
      return 'success'
    case ExportExportStatus.FAILED:
      return 'error'
    case ExportExportStatus.NODATA:
      return 'warning'
    default:
      return 'pending'
  }
}

type MultiRingProps = {
  size?: number
  width?: number
  counts: { running: number; success: number; error: number; pending?: number; warning: number }
  colors?: typeof STATUS_COLORS
  animate?: boolean
}

const MultiRing = ({ size = 36, width = 4, counts, colors = STATUS_COLORS, animate = true }: MultiRingProps) => {
  const total = counts.running + counts.success + counts.error + counts.warning + (counts.pending || 0)
  if (total === 0) return <span className="inline-block w-9 h-9 rounded-full bg-gray-100" />

  const segments: { color: string; percentage: number }[] = [
    { color: colors.error, percentage: counts.error / total },
    { color: colors.success, percentage: counts.success / total },
    { color: colors.running, percentage: counts.running / total },
  ]
  if (counts.pending) segments.push({ color: colors.pending, percentage: counts.pending / total })
  if (counts.warning) segments.push({ color: colors.warning, percentage: counts.warning / total })

  let degStart = 0
  const gradient = segments
    .map((s) => {
      const degEnd = degStart + s.percentage * 360
      const str = `${s.color} ${degStart}deg ${degEnd}deg`
      degStart = degEnd
      return str
    })
    .join(', ')

  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundImage: `conic-gradient(${gradient})`,
    transition: animate ? 'background-image 0.5s ease' : undefined,
    WebkitMask: `radial-gradient(circle at 50% 50%, transparent ${size / 2 - width}px, black ${size / 2 - width}px)`,
    mask: `radial-gradient(circle at 50% 50%, transparent ${size / 2 - width}px, black ${size / 2 - width}px)`,
  }

  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    background: '#e5e7eb',
    WebkitMask: `radial-gradient(circle at 50% 50%, transparent ${size / 2 - width}px, black ${size / 2 - width}px)`,
    mask: `radial-gradient(circle at 50% 50%, transparent ${size / 2 - width}px, black ${size / 2 - width}px)`,
  }

  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full" style={base} />
      <span className="absolute inset-0 rounded-full" style={style} />
    </span>
  )
}

function useOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onOutside])
  return ref
}

function BellButton({ count, onClick, isOpen }: { count: number; onClick: () => void; isOpen: boolean }) {
  return (
    <button onClick={onClick} className={`bg-transparent text-muted-foreground relative grid h-7 w-7 place-items-center rounded-md ${isOpen ? 'is-active' : ''}`} aria-label="Notifications">
      <span className={cx('absolute inset-0 rounded-full animate-ping opacity-40')} />
      <Bell className="h-5 w-5 " />
      {count > 0 && <span className="absolute top-[3px] right-[5px] grid h-2 w-2 place-items-center rounded-full px-1 text-[10px] font-semibold bg-orange-500 shadow-sm"></span>}
    </button>
  )
}

function Row({ job }: { job: TJob }) {
  const uiStatus = mapStatus(job.status)

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative">
        {uiStatus === 'running' && <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin text-blue-500" />}
        <MultiRing
          size={24}
          width={3}
          counts={{
            running: uiStatus === 'running' ? job.progress : 0,
            success: uiStatus === 'success' ? 1 : 0,
            error: uiStatus === 'error' ? 1 : 0,
            warning: uiStatus === 'warning' ? 1 : 0,
          }}
          animate
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium ">{job.title}</div>
        <div className="truncate text-xs capitalize">{uiStatus}</div>
      </div>
      <div>
        {uiStatus === 'success' && !job.downloadUrl && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        {uiStatus === 'success' && job.downloadUrl && (
          <a
            href={job.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:bg-table-row-bg-hover inline-flex items-center gap-2 text-sm bg-panel-bg rounded-md border px-2 py-1 font-bold hover:bg-panel-bg/80 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </a>
        )}

        {uiStatus === 'error' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <XCircle className="h-5 w-5 text-rose-500 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[450px]">
                <p>{job.errorMessage}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {uiStatus === 'warning' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertTriangle className="h-5 w-5 text-orange-500 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p>No data available for export.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}

export default function SystemNotificationTracker() {
  const { jobs } = useTrackedExports()
  const [open, setOpen] = useState(false)

  const counts = useMemo(() => {
    const mapped = jobs.map((j) => mapStatus(j.status))
    return {
      pending: mapped.filter((s) => s === 'pending').length,
      running: mapped.filter((s) => s === 'running').length,
      success: mapped.filter((s) => s === 'success').length,
      warning: mapped.filter((s) => s === 'warning').length,
      error: mapped.filter((s) => s === 'error').length,
      total: mapped.length,
    }
  }, [jobs])

  const ref = useOutside<HTMLDivElement>(() => setOpen(false))

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative" ref={ref}>
        <BellButton count={counts.total} onClick={() => setOpen((v) => !v)} isOpen={open} />
        <div
          className={`absolute right-0 mt-2 w-[380px] max-w-[92vw] origin-top-right rounded-2xl border bg-card shadow-xl z-50
          transition-all duration-200 ease-out
          ${open ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible'}`}
        >
          <div className="max-h-[60vh] overflow-auto p-3">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <div className="text-md font-semibold">Notifications</div>
                <div className="text-sm bg-panel-bg rounded-md border px-1 font-bold">{counts.total}</div>
              </div>

              <div className="relative flex items-center gap-1 text-sm font-semibold cursor-pointer text-normal text-primary group">
                <CheckCheck className="w-4 h-4" />
                <span>Mark all as read</span>
                <span className="absolute bottom-0 left-0 h-[1px] w-full scale-x-0 bg-current transition-transform duration-300 group-hover:scale-x-100 origin-left"></span>
              </div>
            </div>

            <div className="my-1 h-px w-full bg-border" />
            <div className="divide-y divide-gray-100">
              {jobs.map((j) => (
                <div key={j.id} className="px-2">
                  <Row job={j} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
