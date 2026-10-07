'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { isRecord } from '@/utils/type-guards'

export const SURVEY_DRAFT_PREVIEW_ROUTE = '/automation/questionnaires/questionnaire-viewer/draft'
export const SURVEY_PREVIEW_KEY_PARAM = 'key'

type TSurveyJson = Record<string, unknown>

type TPreviewMessage =
  | { type: 'survey-preview-ready'; key: string }
  | { type: 'survey-preview-ping'; key: string }
  | { type: 'survey-preview-accepted'; key: string }
  | { type: 'survey-preview-data'; key: string; json: TSurveyJson }
  | { type: 'survey-preview-error'; key: string; message: string }
  | { type: 'survey-preview-closed'; key: string }

type TPreviewPayload = { json: TSurveyJson } | { error: string }

type TPendingPreview = { target: Window; payload: Promise<TPreviewPayload> }

export type TReceivedSurveyPreview = { status: 'waiting' } | { status: 'ready'; json: TSurveyJson } | { status: 'unavailable'; message: string }

const PREVIEW_HANDSHAKE_TIMEOUT_MS = 3000 // 3s
const PREVIEW_HEARTBEAT_INTERVAL_MS = 1000 // 1s

const PREVIEW_CLOSED_MESSAGE = 'The dialog this preview was opened from has been closed. Open the preview again from the dialog.'
const PREVIEW_MISSING_MESSAGE = 'This preview is no longer available. Open it again from the dialog it was started from.'

const toPreviewMessage = (data: unknown): TPreviewMessage | null => {
  if (!isRecord(data) || typeof data.key !== 'string') return null
  const { type, key } = data
  if (type === 'survey-preview-ready' || type === 'survey-preview-ping' || type === 'survey-preview-accepted' || type === 'survey-preview-closed') return { type, key }
  if (type === 'survey-preview-data' && isRecord(data.json)) return { type, key, json: data.json }
  if (type === 'survey-preview-error' && typeof data.message === 'string') return { type, key, message: data.message }
  return null
}

const post = (target: Window, message: TPreviewMessage) => target.postMessage(message, window.location.origin)

export const useSurveyPreviewSender = () => {
  const pendingRef = useRef(new Map<string, TPendingPreview>())

  useEffect(() => {
    const pending = pendingRef.current

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const message = toPreviewMessage(event.data)
      if (message?.type !== 'survey-preview-ready' && message?.type !== 'survey-preview-ping') return
      const entry = pending.get(message.key)
      if (!entry || event.source !== entry.target) return
      post(entry.target, { type: 'survey-preview-accepted', key: message.key })
      if (message.type === 'survey-preview-ping') return
      void entry.payload.then((payload) => {
        if (pending.get(message.key) !== entry) return
        post(entry.target, 'json' in payload ? { type: 'survey-preview-data', key: message.key, json: payload.json } : { type: 'survey-preview-error', key: message.key, message: payload.error })
      })
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
      pending.forEach((entry, key) => {
        if (!entry.target.closed) post(entry.target, { type: 'survey-preview-closed', key })
      })
      pending.clear()
    }
  }, [])

  return useCallback((buildJson: () => Promise<TSurveyJson>) => {
    pendingRef.current.forEach((entry, pendingKey) => {
      if (entry.target.closed) pendingRef.current.delete(pendingKey)
    })
    const key = crypto.randomUUID()
    const target = window.open(`${SURVEY_DRAFT_PREVIEW_ROUTE}?${SURVEY_PREVIEW_KEY_PARAM}=${key}`, '_blank')
    if (!target) return false
    const payload = buildJson().then(
      (json): TPreviewPayload => ({ json }),
      (error): TPreviewPayload => ({ error: parseErrorMessage(error) }),
    )
    pendingRef.current.set(key, { target, payload })
    return true
  }, [])
}

export const useReceivedSurveyPreview = (key: string | null): TReceivedSurveyPreview => {
  const [opener] = useState<Window | null>(() => window.opener)
  const [received, setReceived] = useState<TReceivedSurveyPreview>({ status: 'waiting' })

  useEffect(() => {
    if (!key || !opener) return

    let settled = false
    let deadline: ReturnType<typeof setTimeout> | undefined
    const heartbeat = setInterval(() => post(opener, { type: 'survey-preview-ping', key }), PREVIEW_HEARTBEAT_INTERVAL_MS)

    const stopWaiting = () => {
      settled = true
      clearTimeout(deadline)
      clearInterval(heartbeat)
    }
    const resetDeadline = () => {
      clearTimeout(deadline)
      deadline = setTimeout(() => {
        stopWaiting()
        setReceived({ status: 'unavailable', message: PREVIEW_MISSING_MESSAGE })
      }, PREVIEW_HANDSHAKE_TIMEOUT_MS)
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== opener) return
      const message = toPreviewMessage(event.data)
      if (settled || !message || message.key !== key) return
      if (message.type === 'survey-preview-accepted') return resetDeadline()
      stopWaiting()
      if (message.type === 'survey-preview-data') setReceived({ status: 'ready', json: message.json })
      if (message.type === 'survey-preview-error') setReceived({ status: 'unavailable', message: message.message })
      if (message.type === 'survey-preview-closed') setReceived({ status: 'unavailable', message: PREVIEW_CLOSED_MESSAGE })
    }

    window.addEventListener('message', handleMessage)
    resetDeadline()
    post(opener, { type: 'survey-preview-ready', key })
    return () => {
      stopWaiting()
      window.removeEventListener('message', handleMessage)
    }
  }, [key, opener])

  if (!key || !opener) return { status: 'unavailable', message: PREVIEW_MISSING_MESSAGE }
  return received
}
