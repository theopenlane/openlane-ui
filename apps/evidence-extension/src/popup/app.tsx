import { useEffect, useState } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { Settings as SettingsIcon } from 'lucide-react'
import { Button } from '@repo/ui/button'
import type { TCapture } from '../lib/capture'
import type { TConnection } from '../lib/connection'
import { PopupHeader } from './components/popup-header'
import { useActiveTab } from './hooks/use-active-tab'
import { useConnection } from './hooks/use-connection'
import type { TEvidenceDraft } from './hooks/use-evidence-draft-form-schema'
import { EVIDENCE_FLOW_MUTATION_KEY, useConnectionCheck } from './hooks/use-openlane-queries'
import { CaptureDetails } from './screens/capture-details'
import { Home } from './screens/home'
import { Review, type TCreatedEvidence } from './screens/review'
import { Settings } from './screens/settings'
import { SignedOut } from './screens/signed-out'
import { Success } from './screens/success'

type TScreen = { name: 'home' } | { name: 'settings' } | { name: 'details' } | { name: 'review'; capture: TCapture } | { name: 'success'; capture: TCapture; evidence: TCreatedEvidence }

const BACK_TARGET: Record<Exclude<TScreen['name'], 'home'>, 'home' | 'details'> = {
  settings: 'home',
  details: 'home',
  review: 'details',
  success: 'home',
}

const EMPTY_DRAFT: TEvidenceDraft = { name: '', description: '', controls: [] }

const ConnectedApp = ({ connection }: { connection: TConnection }) => {
  const [screen, setScreen] = useState<TScreen>({ name: 'home' })
  const [draft, setDraft] = useState<TEvidenceDraft | null>(null)
  const activeTab = useActiveTab()
  useConnectionCheck(connection)
  const isBusy = useIsMutating({ mutationKey: EVIDENCE_FLOW_MUTATION_KEY }) > 0

  const capture = screen.name === 'review' || screen.name === 'success' ? screen.capture : null
  useEffect(() => {
    if (!capture) return
    return () => URL.revokeObjectURL(capture.previewUrl)
  }, [capture])

  const navigate = (target: 'home' | 'details') => {
    if (target === 'home') {
      setDraft(null)
    }
    setScreen(target === 'home' ? { name: 'home' } : { name: 'details' })
  }

  const effectiveDraft = draft ?? { ...EMPTY_DRAFT, name: activeTab.status === 'ready' ? activeTab.target.title : '' }

  const renderScreen = () => {
    switch (screen.name) {
      case 'settings':
        return <Settings connection={connection} />
      case 'details':
        if (activeTab.status !== 'ready') {
          return activeTab.status === 'unsupported' ? <p className="p-4 text-sm text-muted-foreground">{activeTab.reason}</p> : null
        }
        return (
          <CaptureDetails
            connection={connection}
            target={activeTab.target}
            draft={effectiveDraft}
            onCaptured={(nextCapture, nextDraft) => {
              setDraft(nextDraft)
              setScreen({ name: 'review', capture: nextCapture })
            }}
          />
        )
      case 'review':
        return (
          <Review
            connection={connection}
            capture={screen.capture}
            draft={effectiveDraft}
            onRetake={() => navigate('details')}
            onUploaded={(evidence) => setScreen({ name: 'success', capture: screen.capture, evidence })}
          />
        )
      case 'success':
        return (
          <Success
            evidence={screen.evidence}
            capture={screen.capture}
            draft={effectiveDraft}
            onCaptureAnother={() => {
              setDraft(null)
              setScreen({ name: 'details' })
            }}
          />
        )
      case 'home':
        return (
          <Home
            collector={connection.collector}
            organizationName={connection.organizationName}
            captureUnavailableReason={activeTab.status === 'unsupported' ? activeTab.reason : undefined}
            onCapture={() => setScreen({ name: 'details' })}
            onOpenSettings={() => setScreen({ name: 'settings' })}
          />
        )
    }
  }

  return (
    <>
      <PopupHeader
        onBack={screen.name === 'home' || isBusy ? undefined : () => navigate(BACK_TARGET[screen.name])}
        action={screen.name === 'home' && <Button variant="icon" size="icon-sm" icon={<SettingsIcon />} descriptiveTooltipText="Settings" onClick={() => setScreen({ name: 'settings' })} />}
      />
      {renderScreen()}
    </>
  )
}

export const App = () => {
  const state = useConnection()

  if (state.status === 'loading') {
    return null
  }

  if (state.status === 'disconnected') {
    return (
      <>
        <PopupHeader />
        <SignedOut notice={state.notice} />
      </>
    )
  }

  return <ConnectedApp key={state.connection.tokenId} connection={state.connection} />
}
