import React from 'react'
import { Link2, Sparkles } from 'lucide-react'
import { Button } from '@repo/ui/button'

type TLinkedControlsEmptyStateProps = {
  canEdit: boolean
  onLinkControls: () => void
  onSuggest?: () => void
  isSuggesting: boolean
}

export const LinkedControlsEmptyState: React.FC<TLinkedControlsEmptyStateProps> = ({ canEdit, onLinkControls, onSuggest, isSuggesting }) => (
  <div className="@container overflow-hidden rounded-lg border border-dashed">
    <div className="flex border-b border-dashed px-4 py-2 text-xs font-medium uppercase text-muted-foreground" aria-hidden>
      <span className="w-40 shrink-0">Framework</span>
      <span className="hidden flex-1 @sm:block">Control</span>
      <span className="hidden w-64 shrink-0 pl-10 @2xl:block">Other Implementations</span>
    </div>
    <div className="bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[16px_16px] px-4 py-16">
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-lg bg-secondary p-4 text-center">
        <p className="text-base font-medium">No controls linked yet</p>
        <p className="text-sm text-muted-foreground">This implementation isn&apos;t counted toward any framework until it&apos;s linked to the controls it satisfies.</p>
        {canEdit && (
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button type="button" icon={<Link2 size={16} />} iconPosition="left" onClick={onLinkControls}>
              Link Controls
            </Button>
            {onSuggest && (
              <Button type="button" variant="secondary" icon={<Sparkles size={16} />} iconPosition="left" onClick={onSuggest} loading={isSuggesting} disabled={isSuggesting}>
                Suggest controls
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
)
