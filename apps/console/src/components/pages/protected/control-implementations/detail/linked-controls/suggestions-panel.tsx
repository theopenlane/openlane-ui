import React, { useRef } from 'react'
import { Link2, RotateCw, Sparkles } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { DismissButton } from '@/components/shared/docs-help/suggestion-card'
import { StatusLine } from '@/components/shared/status-line/status-line'
import { MAX_SUGGESTION_CANDIDATES } from '@/lib/control-suggestions/schema'
import { pruneLinkedSuggestions, type TControlSuggestions } from '@/lib/query-hooks/use-suggest-controls'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SuggestedControls } from './suggested-controls'

type TSuggestionsPanelProps = {
  controlImplementationId: string
  suggestions?: TControlSuggestions
  error: Error | null
  isFetching: boolean
  linkedIds: ReadonlySet<string>
  onRetry: () => void
  onDismiss: () => void
  onLinkControls: () => void
}

const HEADINGS: Record<TControlSuggestions['source'], string> = {
  organization: 'Suggested from your organization controls',
  framework: 'Suggested framework controls',
}

const PanelMessage = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center">
    <p className="text-sm font-medium">{title}</p>
    {description && <p className="text-sm text-muted-foreground">{description}</p>}
    <div className="mt-1 flex flex-wrap justify-center gap-2">{children}</div>
  </div>
)

export const SuggestionsPanel: React.FC<TSuggestionsPanelProps> = ({ controlImplementationId, suggestions, error, isFetching, linkedIds, onRetry, onDismiss, onLinkControls }) => {
  const headingRef = useRef<HTMLHeadingElement>(null)

  if (isFetching && !suggestions) {
    return <StatusLine>Finding controls that match these details…</StatusLine>
  }
  if (!error && !suggestions) return null

  const linkControlsButton = (
    <Button type="button" variant="secondary" icon={<Link2 size={16} />} iconPosition="left" onClick={onLinkControls}>
      Link Controls
    </Button>
  )

  const renderBody = (): { title: string; body: React.ReactNode } => {
    if (error || !suggestions) {
      return {
        title: 'Suggested controls',
        body: (
          <PanelMessage title="Couldn't suggest controls" description={parseErrorMessage(error)}>
            <Button type="button" icon={<RotateCw size={16} />} iconPosition="left" onClick={onRetry}>
              Try again
            </Button>
            {linkControlsButton}
          </PanelMessage>
        ),
      }
    }

    const { visibleGroups, unlinked } = pruneLinkedSuggestions(suggestions.groups, linkedIds)
    if (unlinked.length) {
      return {
        title: HEADINGS[suggestions.source],
        body: <SuggestedControls controlImplementationId={controlImplementationId} groups={visibleGroups} unlinked={unlinked} linkedIds={linkedIds} onLinked={() => headingRef.current?.focus()} />,
      }
    }
    if (suggestions.groups.length) {
      return { title: 'Suggested controls', body: <PanelMessage title="Every suggested control is already linked">{linkControlsButton}</PanelMessage> }
    }

    const partialNote = suggestions.isPartial ? `Only the first ${MAX_SUGGESTION_CANDIDATES} controls were searched. ` : ''
    return {
      title: 'Suggested controls',
      body: (
        <PanelMessage title="No controls clearly matched these details" description={`${partialNote}Link the controls this implementation satisfies yourself.`}>
          {linkControlsButton}
        </PanelMessage>
      ),
    }
  }

  const { title, body } = renderBody()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 ref={headingRef} tabIndex={-1} className="flex items-center gap-2 text-sm text-muted-foreground outline-hidden">
          <Sparkles size={16} />
          {title}
        </h3>
        <DismissButton onClick={onDismiss} label="Dismiss suggested controls" tooltip="Dismiss" />
      </div>
      {body}
    </div>
  )
}
