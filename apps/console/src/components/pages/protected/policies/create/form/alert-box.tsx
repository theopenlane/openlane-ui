/* eslint-disable react/prop-types */
import { AIAssistButton } from '@/components/shared/ai-suggetions/button'
import { AISuggestionsPanel } from '@/components/shared/ai-suggetions/panel'
import { AI_POLICY_PROMPT } from '@/constants/ai'
import { COMPLIANCE_MANAGEMENT_DOCS_URL, POLICY_HUB_REPO_URL } from '@/constants/docs'
import { useAISuggestions } from '@/hooks/usetGetAISuggetions'
import { Button } from '@repo/ui/button'
import { BookOpenIcon, ChevronDown, FileTextIcon, InfoIcon, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'

const AI_SUGGESTIONS_ENABLED = process.env.NEXT_PUBLIC_AI_SUGGESTIONS_ENABLED === 'true'

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

const HelperText: React.FC<THelperProps> = ({ name, editorRef, onNameChange }) => {
  const [isHelperOpen, setIsAIHelperOpen] = useState(true)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [tempPolicyName, setTempPolicyName] = useState('')

  const { suggestions, loading, activeSection, getAISuggestions, clearSuggestions } = useAISuggestions()

  // Insert AI suggestions into the editor
  const handleInsertIntoEditor = (text: string) => {
    editorRef.current.insertContent(text, true)
    clearSuggestions()
  }

  const handleGenerateClick = () => {
    if (!AI_SUGGESTIONS_ENABLED) return

    // If no name is provided, show dialog
    if (!name || name.trim() === '') {
      setShowNameDialog(true)
      setTempPolicyName('')
    } else {
      // Use existing name
      generatePolicy(name)
    }
  }

  const generatePolicy = (policyName: string) => {
    if (!AI_SUGGESTIONS_ENABLED) return

    getAISuggestions(
      'policy',
      AI_POLICY_PROMPT(policyName),
      // TODO: add additional context if, such as linked controls, organization name, etc.
    )
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
    generatePolicy(tempPolicyName.trim())

    // Close dialog
    setShowNameDialog(false)
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-lg border dark:border-gray-700/50 bg-gradient-to-br dark:from-blue-800/10 dark:via-gray-800/60 dark:to-purple-900/20 from-blue-200/10 via-white-800/20 to-purple-400/10">
        {/* Header */}
        <button type="button" onClick={() => setIsAIHelperOpen(!isHelperOpen)} className="w-full flex items-center justify-between px-4 pt-4 pb-2 transition-colors">
          <div className="flex items-center gap-3">
            {AI_SUGGESTIONS_ENABLED ? (
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-purple-400" />
              </div>
            ) : (
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center">
                <InfoIcon className="h-4 w-4 text-blue-400" />
              </div>
            )}
            <div className="flex text-left">
              <p className="text-base font-semibold">Need help getting started?</p>
              {!isHelperOpen &&
                (AI_SUGGESTIONS_ENABLED ? <p className="ml-2 opacity-70">Let AI help you draft your policy</p> : <p className="ml-2 opacity-70">Explore templates and documentation for guidance</p>)}
            </div>
          </div>

          <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ${isHelperOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Collapsible content */}
        {isHelperOpen && (
          <div className="ml-12 px-4 pb-6 space-y-3">
            {AI_SUGGESTIONS_ENABLED ? (
              <p className="text-sm opacity-70">Let AI help you draft your policy, or explore our templates and documentation for guidance and best-practice examples.</p>
            ) : (
              <p className="pb-2 text-sm opacity-70">Explore our templates for ideas and use the documentation to learn how to tailor policies to your organization.</p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              {AI_SUGGESTIONS_ENABLED && <AIAssistButton onGetSuggestions={handleGenerateClick} loading={loading && activeSection === 'policy'} label="Generate with AI" variant="primary" />}

              <a href={`${POLICY_HUB_REPO_URL}`} target="_blank" rel="noreferrer" aria-label="Policy Templates">
                <Button type="button" variant="secondary" className="h-8 !px-2 !pl-3" icon={<FileTextIcon />} iconPosition="left">
                  Browse Templates
                </Button>
              </a>
              <a href={`${COMPLIANCE_MANAGEMENT_DOCS_URL}/policy-and-procedure-management/policies`} target="_blank" rel="noreferrer" aria-label="View Compliance Management Documentation">
                <Button type="button" variant="secondary" className="h-8 !px-2 !pl-3" icon={<BookOpenIcon />} iconPosition="left">
                  View Docs
                </Button>
              </a>
            </div>

            {/* AI Suggestions Panel */}
            {AI_SUGGESTIONS_ENABLED
              ? activeSection === 'policy' && <AISuggestionsPanel suggestions={suggestions} loading={loading} onDismiss={clearSuggestions} onInsert={handleInsertIntoEditor} variant="inline" />
              : null}
          </div>
        )}
      </div>

      {AI_SUGGESTIONS_ENABLED &&
        showNameDialog &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100">Name Your Policy</h3>
                </div>
                <button type="button" onClick={() => setShowNameDialog(false)} className="text-gray-400 hover:text-gray-300 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmitName} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Policy Name</label>
                  <input
                    type="text"
                    value={tempPolicyName}
                    onChange={(e) => setTempPolicyName(e.target.value)}
                    placeholder="e.g., Access Control Policy"
                    autoFocus
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                <p className="text-sm text-gray-400">Give your policy a descriptive name. AI will use this to generate relevant content.</p>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setShowNameDialog(false)} className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors">
                    Cancel
                  </Button>
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
    </>
  )
}

export default HelperText
