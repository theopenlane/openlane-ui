'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { TJob, useTrackedExports } from '@/components/shared/export/use-tacked-export'
import { ExportExportStatus } from '@repo/codegen/src/schema'

const cx = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ')

function mapStatus(status: ExportExportStatus): 'running' | 'success' | 'error' | 'pending' {
  switch (status) {
    case ExportExportStatus.PENDING:
      return 'running'
    case ExportExportStatus.READY:
      return 'success'
    case ExportExportStatus.FAILED:
    case ExportExportStatus.NODATA:
      return 'error'
    default:
      return 'pending'
  }
}

function Ring({ size = 28, width = 3, progress = 0, color = '#3b82f6', bg = '#e5e7eb' }) {
  const p = Math.max(0, Math.min(100, progress))
  const style: React.CSSProperties = {
    width: size,
    height: size,
    backgroundImage: `conic-gradient(${color} ${p * 3.6}deg, transparent 0)`,
    WebkitMask: `radial-gradient(circle at 50% 50%, transparent ${size / 2 - width}px, black ${size / 2 - width}px)`,
    mask: `radial-gradient(circle at 50% 50%, transparent ${size / 2 - width}px, black ${size / 2 - width}px)`,
  }
  const base: React.CSSProperties = {
    width: size,
    height: size,
    background: bg,
    WebkitMask: `radial-gradient(circle at 50% 50%, transparent ${size / 2 - width}px, black ${size / 2 - width}px)`,
    mask: `radial-gradient(circle at 50% 50%, transparent ${size / 2 - width}px, black ${size / 2 - width}px)`,
  }
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full" style={base} />
      <span className="absolute inset-0 rounded-full transition-all" style={style} />
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

function BellButton({ count, state, onClick }: { count: number; state: 'idle' | 'active' | 'success' | 'error'; onClick: () => void }) {
  const badge = state === 'success' ? 'bg-green-500' : state === 'error' ? 'bg-rose-500' : state === 'active' ? 'bg-blue-500' : 'bg-gray-300'
  const halo = state === 'error' ? 'bg-rose-400' : 'bg-blue-400'
  const ping = state === 'active' || state === 'error'
  return (
    <button
      onClick={onClick}
      className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      aria-label="Notifications"
    >
      {ping && <span className={cx('absolute inset-0 rounded-full animate-ping opacity-40', halo)} />}
      <Bell className="h-5 w-5 text-gray-900" />
      <span className={cx('absolute -top-1 -right-1 grid h-5 min-w-[1.25rem] place-items-center rounded-full px-1 text-[10px] font-semibold text-white shadow-sm', badge)}>{count}</span>
    </button>
  )
}

function Row({ job }: { job: TJob }) {
  const uiStatus = mapStatus(job.status)
  const c = uiStatus === 'error' ? '#f43f5e' : uiStatus === 'success' ? '#22c55e' : '#3b82f6'

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative">
        {uiStatus === 'running' && <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin text-blue-500" />}
        <Ring size={24} width={3} progress={uiStatus === 'success' || uiStatus === 'error' ? 100 : job.progress} color={c} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium ">{job.title}</div>
        <div className="truncate text-xs capitalize">{uiStatus === 'running' ? `${job.progress}%` : uiStatus}</div>
        {uiStatus === 'success' && job.downloadUrl && (
          <a href={job.downloadUrl} target="_blank" rel="noreferrer" className="truncate text-xs text-blue-600 hover:underline">
            Download File
          </a>
        )}

        {uiStatus === 'running' && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${job.progress}%` }} />
          </div>
        )}
      </div>
      <div>
        {uiStatus === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        {uiStatus === 'error' && <XCircle className="h-5 w-5 text-rose-500" />}
      </div>
    </div>
  )
}

export default function SystemNotificationTracker() {
  const { jobs, isLoading } = useTrackedExports()
  const [open, setOpen] = useState(false)

  const counts = useMemo(() => {
    const mapped = jobs.map((j) => mapStatus(j.status))
    return {
      pending: mapped.filter((s) => s === 'pending').length,
      running: mapped.filter((s) => s === 'running').length,
      success: mapped.filter((s) => s === 'success').length,
      error: mapped.filter((s) => s === 'error').length,
      total: mapped.length,
    }
  }, [jobs])

  const bellState: 'idle' | 'active' | 'success' | 'error' =
    counts.error > 0 ? 'error' : counts.success === counts.total && counts.total > 0 ? 'success' : counts.pending + counts.running > 0 ? 'active' : 'idle'

  const overall = Math.round((jobs.reduce((a, j) => a + (mapStatus(j.status) === 'success' ? 100 : j.progress), 0) / (jobs.length * 100)) * 100)

  const ref = useOutside<HTMLDivElement>(() => setOpen(false))

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative" ref={ref}>
        <BellButton count={counts.pending + counts.running} state={bellState} onClick={() => setOpen((v) => !v)} />
        {open && (
          <div className="absolute right-0 mt-2 w-[380px] max-w-[92vw] origin-top-right rounded-2xl border border-gray-200 bg-card shadow-xl ring-1 ring-black/5 z-50">
            <div className="max-h-[60vh] overflow-auto p-3">
              <div className="flex items-center gap-3 p-2">
                <Ring size={36} width={4} progress={overall} color={bellState === 'success' ? '#22c55e' : bellState === 'error' ? '#f43f5e' : '#3b82f6'} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">{counts.total - counts.success - counts.error} in progress</div>
                  <div className="text-xs text-gray-500">{overall}% overall</div>
                </div>
              </div>
              <div className="my-2 h-px w-full bg-gray-100" />
              <div className="divide-y divide-gray-100">
                {jobs.map((j) => (
                  <div key={j.id} className="px-2">
                    <Row job={j} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
