import { AIAssistButton } from '@/components/shared/ai-suggetions/button'
import { AISuggestionsPanel } from '@/components/shared/ai-suggetions/panel'
import { COMPLIANCE_MANAGEMENT_DOCS_URL } from '@/constants/docs'
import { useNotification } from '@/hooks/useNotification'
import { useAISuggestions } from '@/hooks/useGetAISuggestions'
import { useCreateUploadInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { Button } from '@repo/ui/button'
import { BookOpenIcon, ChevronDown, FileTextIcon, InfoIcon, LoaderCircle, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { TUploadedFile } from '../../../evidence/upload/types/TUploadedFile'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useRouter } from 'next/navigation'
import { PolicyTemplateBrowser } from '@/components/shared/github-selector/policy-selector'
import { Input } from '@repo/ui/input'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useSession } from 'next-auth/react'
import { useOrganization } from '@/hooks/useOrganization'
import { aiEnabled, policyPrompt } from '@repo/dally/ai'

// Define the editor ref type
interface EditorRef {
  current: {
    insertContent: (text: string, replace?: boolean) => void
  }
}

type THelperProps = {
  name?: string
  editorRef: EditorRef
  onNameChange?: (name: string) => void
}

const HelperText = ({ name, editorRef, onNameChange }: THelperProps) => {
  const { data: sessionData } = useSession()
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId)
  const router = useRouter()
  const [isHelperOpen, setIsAIHelperOpen] = useState(true)

  const [showNameDialog, setShowNameDialog] = useState(false)
  const [tempPolicyName, setTempPolicyName] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')

  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false)
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false)

  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createUploadPolicy } = useCreateUploadInternalPolicy()

  const { suggestions, loading, activeSection, getAISuggestions, clearSuggestions } = useAISuggestions()

  // Insert AI suggestions into the editor
  const handleInsertIntoEditor = (text: string) => {
    const trimmed = text.replace(/^\s+/, '')
    editorRef.current.insertContent(trimmed, true)
    clearSuggestions()
  }

  const handleGenerateClick = () => {
    if (!aiEnabled) return

    // If no name is provided, show dialog
    const policyNameToUse = tempPolicyName || name || ''
    if (!policyNameToUse || policyNameToUse.trim() === '') {
      setShowNameDialog(true)
      setTempPolicyName('')
    } else {
      // Use existing name
      generatePolicy(policyNameToUse, additionalContext)
    }
  }

  const generatePolicy = (policyName: string, context: string) => {
    if (!aiEnabled) return

    const baseContext = {
      organization: {
        organizationName: currentOrganization?.node?.displayName,
      },
      user: {
        name: sessionData?.user?.name || '',
      },
      additionalContext: context,
    }

    getAISuggestions('policy', policyPrompt(policyName), baseContext)
  }

  const handleSubmitName = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!tempPolicyName.trim()) {
      return
    }

    // Update the name field
    if (onNameChange) {
      onNameChange(tempPolicyName.trim())
    }

    // Generate policy
    generatePolicy(tempPolicyName.trim(), additionalContext)

    // Close dialog
    setShowNameDialog(false)
  }

  const handleTemplateFileSelect = async (file: TUploadedFile) => {
    setIsCreatingFromTemplate(true)
    try {
      const result = await createUploadPolicy({ internalPolicyFile: file.file })
      const policyId = result.createUploadInternalPolicy.internalPolicy.id

      successNotification({
        title: 'Policy Created',
        description: 'Policy has been successfully created from template',
      })

      router.push(`/policies/${policyId}/view`)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })

      setIsCreatingFromTemplate(false)
    }
  }

  let parsedSuggestions = { text: '' }
  if (!loading && suggestions) {
    try {
      parsedSuggestions = JSON.parse(suggestions)
    } catch (e) {
      console.error('Failed to parse AI suggestions:', e)
    }
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-lg border dark:border-gray-700/50 bg-linear-to-br dark:from-blue-800/10 dark:via-gray-800/60 dark:to-purple-900/20 from-blue-200/10 via-white-800/20 to-purple-400/10">
        {/* Header */}
        <button type="button" onClick={() => setIsAIHelperOpen(!isHelperOpen)} className="w-full flex items-center justify-between px-4 pt-4 pb-2 transition-colors">
          <div className="flex items-center gap-3">
            {aiEnabled ? (
              <div className="shrink-0 w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-purple-400" />
              </div>
            ) : (
              <div className="shrink-0 w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center">
                <InfoIcon className="h-4 w-4 text-blue-400" />
              </div>
            )}
            <div className="flex text-left">
              <p className="text-base font-semibold">Need help getting started?</p>
              {!isHelperOpen &&
                (aiEnabled ? <p className="ml-2 opacity-70">Let AI help you draft your policy</p> : <p className="ml-2 opacity-70">Explore templates and documentation for guidance</p>)}
            </div>
          </div>

          <ChevronDown className={`h-4 w-4 transition-transform shrink-0 ${isHelperOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Collapsible content */}
        {isHelperOpen && (
          <div className="ml-12 px-4 pb-6 space-y-3">
            {aiEnabled ? (
              <p className="text-sm opacity-70">Let AI help you draft your policy, or explore our templates and documentation for guidance and best-practice examples.</p>
            ) : (
              <p className="pb-2 text-sm opacity-70">Explore our templates for ideas and use the documentation to learn how to tailor policies to your organization.</p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              {aiEnabled && <AIAssistButton onGetSuggestions={handleGenerateClick} loading={loading && activeSection === 'policy'} label="Generate with AI" variant="primary" />}

              <Button
                type="button"
                variant="secondary"
                className="h-8 px-2! pl-3!"
                icon={<FileTextIcon />}
                iconPosition="left"
                onClick={() => setShowTemplateBrowser(true)}
                disabled={isCreatingFromTemplate}
              >
                Browse Templates
              </Button>

              <a href={`${COMPLIANCE_MANAGEMENT_DOCS_URL}/policy-and-procedure-management/policies`} target="_blank" rel="noreferrer" aria-label="View Compliance Management Documentation">
                <Button type="button" variant="secondary" className="h-8 px-2! pl-3!" icon={<BookOpenIcon />} iconPosition="left">
                  View Docs
                </Button>
              </a>
            </div>

            {/* AI Suggestions Panel */}
            {aiEnabled
              ? activeSection === 'policy' && <AISuggestionsPanel suggestions={parsedSuggestions} loading={loading} onDismiss={clearSuggestions} onInsert={handleInsertIntoEditor} variant="inline" />
              : null}
          </div>
        )}
      </div>

      {aiEnabled &&
        showNameDialog &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-secondary rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Policy Details</h3>
                </div>
                <Button variant="icon" type="button" onClick={() => setShowNameDialog(false)} className="transition-colors">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmitName} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Policy Name</label>
                  <Input
                    type="text"
                    value={tempPolicyName}
                    onChange={(e) => setTempPolicyName(e.target.value)}
                    placeholder="e.g., Access Control Policy"
                    autoFocus
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                <p className="text-sm opacity-70">Give your policy a descriptive name. AI will use this to generate relevant content.</p>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional Context <span className="opacity-60"> (optional)</span>
                  </label>
                  <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="E.g., specific systems, teams, regulations, or requirements this policy should cover."
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all min-h-[80px]"
                  />
                </div>

                <p className="text-sm opacity-70">Provide any extra details or requirement to use within the policy</p>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <CancelButton className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors" onClick={() => setShowNameDialog(false)}></CancelButton>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!tempPolicyName.trim()}
                    className="flex-1 px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    Generate Policy
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      <PolicyTemplateBrowser isOpen={showTemplateBrowser} onClose={() => setShowTemplateBrowser(false)} onFileSelect={handleTemplateFileSelect} />

      {/* Full-screen loading overlay */}
      {isCreatingFromTemplate &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-90">
            <div className="bg-secondary rounded-xl border p-8 flex flex-col items-center gap-4">
              <LoaderCircle className="animate-spin opacity-30" size={32} />
              <p className="text-lg">Creating policy from template...</p>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

export default HelperText
