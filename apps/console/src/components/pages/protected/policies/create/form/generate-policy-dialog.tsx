import { useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useOrganization } from '@/hooks/useOrganization'
import { useStandardsSelect } from '@/lib/graphql-hooks/standard'
import { organizationStandardsWhere } from '@/constants/standards'
import { FrameworkContextField } from './framework-context-field'

export type TGeneratePolicyRequest = {
  policyName: string
  additionalContext: string
  frameworkNames: string[]
}

type TGeneratePolicyDialogProps = {
  initialPolicyName: string
  onClose: () => void
  onGenerate: (request: TGeneratePolicyRequest) => void
}

export const GeneratePolicyDialog = ({ initialPolicyName, onClose, onGenerate }: TGeneratePolicyDialogProps) => {
  const { currentOrgId } = useOrganization()
  const policyNameId = useId()
  const additionalContextId = useId()
  const [policyName, setPolicyName] = useState(initialPolicyName)
  const [additionalContext, setAdditionalContext] = useState('')
  const [useFrameworks, setUseFrameworks] = useState(false)
  const [selectedFrameworkIds, setSelectedFrameworkIds] = useState<string[]>([])

  const {
    standardOptions,
    isPending,
    isPlaceholderData,
    isError: isFrameworksError,
  } = useStandardsSelect({
    where: organizationStandardsWhere(currentOrgId),
    enabled: !!currentOrgId,
  })
  const frameworks = useMemo(() => standardOptions.map(({ value, label }) => ({ id: value, name: label })), [standardOptions])
  const selectedFrameworks = useMemo(() => {
    if (!useFrameworks) return []
    if (frameworks.length === 1) return frameworks
    return frameworks.filter((framework) => selectedFrameworkIds.includes(framework.id))
  }, [useFrameworks, frameworks, selectedFrameworkIds])
  const isMissingFramework = useFrameworks && frameworks.length > 0 && selectedFrameworks.length === 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const trimmedName = policyName.trim()
    if (!trimmedName || isMissingFramework) return

    onGenerate({
      policyName: trimmedName,
      additionalContext: additionalContext.trim(),
      frameworkNames: selectedFrameworks.map((framework) => framework.name),
    })
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-secondary rounded-xl shadow-2xl max-w-md w-full max-h-full flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold">Policy Details</h3>
          </div>
          <Button variant="icon" type="button" onClick={onClose} className="transition-colors">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <div className="min-h-0 overflow-y-auto p-6 pb-2 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor={policyNameId}>
                Policy Name
              </label>
              <Input
                id={policyNameId}
                type="text"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                placeholder="e.g., Access Control Policy"
                autoFocus
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            <p className="text-sm opacity-70">Give your policy a descriptive name. AI will use this to generate relevant content.</p>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor={additionalContextId}>
                Additional Context <span className="opacity-60"> (optional)</span>
              </label>
              <textarea
                id={additionalContextId}
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="E.g., specific systems, teams, regulations, or requirements this policy should cover."
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all min-h-[80px]"
              />
            </div>

            <p className="text-sm opacity-70">Provide any extra details or requirement to use within the policy</p>

            <FrameworkContextField
              frameworks={frameworks}
              isLoading={isPending || isPlaceholderData}
              isError={isFrameworksError}
              checked={useFrameworks}
              onCheckedChange={setUseFrameworks}
              selectedFrameworks={selectedFrameworks}
              selectedIds={selectedFrameworkIds}
              onSelectedIdsChange={setSelectedFrameworkIds}
            />
          </div>

          <div className="flex gap-3 px-6 pt-4 pb-6">
            <CancelButton className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors" onClick={onClose}></CancelButton>
            <Button
              type="submit"
              variant="primary"
              disabled={!policyName.trim() || isMissingFramework}
              className="flex-1 px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Generate Policy
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
