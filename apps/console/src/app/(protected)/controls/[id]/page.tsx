'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useGetControlAssociationsById, useGetControlById, useGetControlDiscussionById, useUpdateControl } from '@/lib/graphql-hooks/controls'
import { FormProvider, useForm } from 'react-hook-form'
import { Value } from 'platejs'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Check, CirclePlus, Copy, CopyPlus, InfoIcon, PanelRightClose, PencilIcon, SaveIcon, Sparkles, XIcon } from 'lucide-react'
import TitleField from '../../../../components/pages/protected/controls/form-fields/title-field.tsx'
import DescriptionField from '../../../../components/pages/protected/controls/form-fields/description-field.tsx'
import PropertiesCard from '../../../../components/pages/protected/controls/propereties-card/properties-card.tsx'
import InfoCard from '../../../../components/pages/protected/controls/info-card.tsx'
import { Control, ControlControlSource, ControlControlStatus, EvidenceEdge, UpdateControlInput } from '@repo/codegen/src/schema.ts'
import { useNavigationGuard } from 'next-navigation-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import SubcontrolsTable from '@/components/pages/protected/controls/subcontrols-table.tsx'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canCreate, canDelete, canEdit } from '@/lib/authz/utils.ts'
import EvidenceDetailsSheet from '@/components/pages/protected/evidence/evidence-details-sheet.tsx'
import ControlEvidenceTable from '@/components/pages/protected/evidence/evidence-table.tsx'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog.tsx'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config.ts'
import { TaskIconBtn } from '@/components/shared/enum-mapper/task-enum.tsx'
import Menu from '@/components/shared/menu/menu.tsx'
import DeleteControlDialog from '@/components/pages/protected/controls/delete-control-dialog.tsx'
import { CreateBtn } from '@/components/shared/enum-mapper/common-enum.tsx'
import Link from 'next/link'
import { useNotification } from '@/hooks/useNotification.tsx'
import CreateControlObjectiveSheet from '@/components/pages/protected/controls/control-objectives/create-control-objective-sheet'
import CreateControlImplementationSheet from '@/components/pages/protected/controls/control-implementation/create-control-implementation-sheet.tsx'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar.tsx'
import RelatedControls from '@/components/pages/protected/controls/related-controls.tsx'
import { useOrganization } from '@/hooks/useOrganization'
import ObjectAssociationSwitch from '@/components/shared/object-association/object-association-switch.tsx'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import Loading from './loading.tsx'
import ControlImplementationsSection from '@/components/pages/protected/controls/control-implementations-section.tsx'
import ControlObjectivesSection from '@/components/pages/protected/controls/control-objectives-section.tsx'
import ControlCommentsCard from '@/components/pages/protected/controls/comments-card.tsx'
import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions.ts'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { SaveButton } from '@/components/shared/save-button/save-button.tsx'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button.tsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Textarea } from '@repo/ui/textarea'

interface FormValues {
  refCode: string
  description: Value | string
  descriptionJSON?: Value
  delegateID: string
  controlOwnerID: string
  category?: string
  subcategory?: string
  status: ControlControlStatus
  mappedCategories: string[]
  source?: ControlControlSource
  referenceID?: string
  auditorReferenceID?: string
  title: string
  controlKindName?: string
}

interface SheetData {
  refCode: string
  content: React.ReactNode
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const MAX_CHAT_HISTORY = 10 // Adjust this number as needed
const CHAT_STORAGE_KEY = 'control-chat-history'

const initialDataObj = {
  refCode: '',
  description: '',
  descriptionJSON: undefined,
  delegateID: '',
  controlOwnerID: '',
  category: '',
  subcategory: '',
  status: ControlControlStatus.NOT_IMPLEMENTED,
  mappedCategories: [],
  title: '',
}

const ControlDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { data, isLoading, isError } = useGetControlById(id)
  const [isEditing, setIsEditing] = useState(false)
  const [showSheet, setShowSheet] = useState<boolean>(false)
  const [sheetData, setSheetData] = useState<SheetData | null>(null)
  const [initialValues, setInitialValues] = useState<FormValues>(initialDataObj)
  const { data: permission } = useAccountRoles(ObjectEnum.CONTROL, id)
  const { data: orgPermission } = useOrganizationRoles()

  const { successNotification, errorNotification } = useNotification()
  const [showCreateObjectiveSheet, setShowCreateObjectiveSheet] = useState(false)
  const [showCreateImplementationSheet, setShowCreateImplementationSheet] = useState(false)

  const [showAskAIDialog, setShowAskAIDialog] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isSourceFramework = data?.control.source === ControlControlSource.FRAMEWORK
  const { mutateAsync: updateControl } = useUpdateControl()
  const plateEditorHelper = usePlateEditor()
  const { data: discussionData } = useGetControlDiscussionById(id)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const { data: associationsData } = useGetControlAssociationsById(id)

  useEffect(() => {
    const loadChatHistory = () => {
      try {
        const stored = localStorage.getItem(`${CHAT_STORAGE_KEY}-${id}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          // Convert timestamp strings back to Date objects
          const history = parsed.map((msg: ChatMessage) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
          setChatHistory(history)
        }
      } catch (error) {
        console.error('Failed to load chat history:', error)
      }
    }
    loadChatHistory()
  }, [id])

  useEffect(() => {
    if (chatHistory.length > 0) {
      try {
        // Keep only the last MAX_CHAT_HISTORY messages
        const trimmedHistory = chatHistory.slice(-MAX_CHAT_HISTORY)
        localStorage.setItem(`${CHAT_STORAGE_KEY}-${id}`, JSON.stringify(trimmedHistory))
      } catch (error) {
        console.error('Failed to save chat history:', error)
      }
    }
  }, [chatHistory, id])

  const memoizedSections = useMemo(() => {
    if (!associationsData?.control || !data) return {}
    return {
      policies: associationsData.control.internalPolicies,
      procedures: associationsData.control.procedures,
      tasks: associationsData.control.tasks,
      programs: associationsData.control.programs,
      risks: associationsData.control.risks,
      subcontrols: data.control.subcontrols,
    }
  }, [associationsData?.control, data])

  const memoizedCenterNode = useMemo(() => {
    if (!data?.control) return null
    return {
      node: data?.control,
      type: ObjectAssociationNodeEnum.CONTROL,
    }
  }, [data?.control])

  const form = useForm<FormValues>({
    defaultValues: initialDataObj,
  })

  const { isDirty } = form.formState

  const navGuard = useNavigationGuard({ enabled: isDirty })

  const onSubmit = async (values: FormValues) => {
    try {
      const changedFields = Object.entries(values).reduce<Record<string, unknown>>((acc, [key, value]) => {
        const initialValue = initialValues[key as keyof FormValues]
        if (JSON.stringify(value) !== JSON.stringify(initialValue)) {
          acc[key] = value
        }
        return acc
      }, {})

      if (changedFields.descriptionJSON) {
        changedFields.descriptionJSON = values?.descriptionJSON
        changedFields.description = await plateEditorHelper.convertToHtml(values.descriptionJSON as Value)
      }

      if (isSourceFramework) {
        //remove readonly fields
        delete changedFields.title
        delete changedFields.refCode
        delete changedFields.descriptionJSON
        delete changedFields.description
      }

      const input: UpdateControlInput = Object.fromEntries(Object.entries(changedFields).map(([key, value]) => [key, value || undefined])) as UpdateControlInput

      if (Object.keys(input).length === 0) {
        setIsEditing(false)
        return
      }

      await updateControl({
        updateControlId: id!,
        input,
      })

      successNotification({
        title: 'Control updated',
        description: 'The control was successfully updated.',
      })

      setIsEditing(false)
    } catch {
      errorNotification({
        title: 'Failed to update control',
      })
    }
  }

  const showInfoDetails = (refCode: string, content: React.ReactNode) => {
    setSheetData({ refCode, content })
    setShowSheet(true)
  }

  const handleSheetClose = (open: boolean) => {
    if (!open) {
      setShowSheet(false)
      setTimeout(() => {
        setSheetData(null)
      }, 300)
    }
  }

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    form.reset(initialValues)
    setIsEditing(false)
  }

  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsEditing(true)
  }

  const handleUpdateField = async (input: UpdateControlInput) => {
    try {
      await updateControl({ updateControlId: id, input })
      successNotification({
        title: 'Control updated',
        description: 'The control was successfully updated.',
      })
    } catch {
      errorNotification({
        title: 'Failed to update control',
      })
    }
  }

  const handleAskAI = async () => {
    if (!aiPrompt.trim()) {
      errorNotification({
        title: 'Please enter a prompt',
      })
      return
    }

    if (!data?.control) {
      errorNotification({
        title: 'Control data not available',
      })
      return
    }

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: aiPrompt,
      timestamp: new Date(),
    }
    setChatHistory((prev) => [...prev, userMessage])
    setAiPrompt('')
    setIsLoadingAI(true)

    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          context: {
            background: "Control Details for the provided request, use this information to answer the user's question or provide suggestions.",
            control: {
              refCode: data.control.refCode,
              title: data.control.title || data.control.refCode,
              framework: data.control.referenceFramework,
              description: data.control.description,
            },
            organization: {
              organizationName: currentOrganization?.node?.displayName,
            },
            conversationHistory: chatHistory.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI suggestions')
      }

      const responseData = await response.json()
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: responseData.text || 'No response received',
        timestamp: new Date(),
      }
      setChatHistory((prev) => [...prev, assistantMessage])
    } catch (error) {
      errorNotification({
        title: 'Failed to get AI suggestions',
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setIsLoadingAI(false)
    }
  }

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
      errorNotification({
        title: 'Failed to copy message',
      })
    }
  }

  const handleCloseAIDialog = () => {
    setShowAskAIDialog(false)
    setAiPrompt('')
    setIsCopied(false)
  }

  const handleClearChat = () => {
    setChatHistory([])
    try {
      localStorage.removeItem(`${CHAT_STORAGE_KEY}-${id}`)
    } catch (error) {
      console.error('Failed to clear chat history:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAskAI()
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatHistory])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Controls', href: '/controls' },
      { label: data?.control?.refCode, isLoading: isLoading },
    ])
  }, [setCrumbs, data?.control, isLoading])

  useEffect(() => {
    if (data?.control) {
      const newValues: FormValues = {
        refCode: data.control.refCode || '',
        description: data.control.description || '',
        descriptionJSON: data.control?.descriptionJSON ? (data.control.descriptionJSON as Value) : undefined,
        delegateID: data.control.delegate?.id || '',
        controlOwnerID: data.control.controlOwner?.id || '',
        category: data.control.category || '',
        subcategory: data.control.subcategory || '',
        status: data.control.status || ControlControlStatus.NOT_IMPLEMENTED,
        mappedCategories: data.control.mappedCategories || [],
        source: data.control.source || undefined,
        referenceID: data.control.referenceID || undefined,
        auditorReferenceID: data.control.auditorReferenceID || undefined,
        title: data.control.title ? `${data.control.refCode} ${data.control.title}` : data.control.refCode,
        controlKindName: data.control?.controlKindName || undefined,
      }
      form.reset(newValues)
      setInitialValues(newValues)
    }
  }, [data?.control, form])

  if (isLoading) {
    return <Loading />
  }
  if (isError || !data?.control) return <div className="p-4 text-red-500">Control not found</div>
  const control = data?.control
  const hasInfoData = control.implementationGuidance || control.exampleEvidence || control.controlQuestions || control.assessmentMethods || control.assessmentObjectives

  const menuComponent = (
    <div className="space-y-4">
      {isEditing && (
        <div className="flex gap-2 justify-end">
          <CancelButton onClick={handleCancel}></CancelButton>
          <SaveButton />
        </div>
      )}
      {!isEditing && (
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" className="h-8 !px-2" onClick={() => setShowAskAIDialog(true)} icon={<Sparkles size={16} />}>
            Ask AI
          </Button>
          <Menu
            trigger={CreateBtn}
            content={
              <>
                {canCreate(orgPermission?.roles, AccessEnum.CanCreateControlImplementation) && (
                  <button onClick={() => setShowCreateImplementationSheet(true)} className="flex items-center space-x-2 bg-transparent cursor-pointer px-1">
                    <CirclePlus size={16} strokeWidth={2} />
                    <span>Control Implementation</span>
                  </button>
                )}
                {canCreate(orgPermission?.roles, AccessEnum.CanCreateControlObjective) && (
                  <button onClick={() => setShowCreateObjectiveSheet(true)} className="flex items-center space-x-2 bg-transparent cursor-pointer px-1">
                    <CirclePlus size={16} strokeWidth={2} />
                    <span>Control Objective</span>
                  </button>
                )}
                {canCreate(orgPermission?.roles, AccessEnum.CanCreateControlObjective) && (
                  <CreateControlObjectiveSheet
                    open={showCreateObjectiveSheet}
                    onOpenChange={(open) => {
                      setShowCreateObjectiveSheet(open)
                    }}
                  />
                )}
                {canCreate(orgPermission?.roles, AccessEnum.CanCreateControlImplementation) && (
                  <CreateControlImplementationSheet
                    open={showCreateImplementationSheet}
                    onOpenChange={(open) => {
                      setShowCreateImplementationSheet(open)
                    }}
                  />
                )}
                {canCreate(orgPermission?.roles, AccessEnum.CanCreateSubcontrol) && (
                  <Link href={`/controls/${id}/create-subcontrol`}>
                    <button className="flex items-center space-x-2 bg-transparent px-1">
                      <CirclePlus size={16} strokeWidth={2} />
                      <span>Subcontrol</span>
                    </button>
                  </Link>
                )}
                <CreateTaskDialog
                  trigger={TaskIconBtn}
                  className="px-1 bg-transparent"
                  defaultSelectedObject={ObjectTypeObjects.CONTROL}
                  initialData={{
                    programIDs: (associationsData?.control.programs?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
                    procedureIDs: (associationsData?.control.procedures?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
                    internalPolicyIDs: (associationsData?.control.internalPolicies?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
                    controlObjectiveIDs: (control.controlObjectives?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
                    riskIDs: (associationsData?.control.risks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
                    controlIDs: [id],
                  }}
                />
                {canCreate(orgPermission?.roles, AccessEnum.CanCreateMappedControl) && (
                  <Link href={`/controls/${id}/map-control`}>
                    <button className="flex items-center space-x-2 px-1 bg-transparent">
                      <CirclePlus size={16} strokeWidth={2} />
                      <span>Map Control</span>
                    </button>
                  </Link>
                )}
                {canCreate(orgPermission?.roles, AccessEnum.CanCreateControl) && (
                  <Link href={`/controls/${id}/clone-control?mapControlId=${id}`}>
                    <button className="flex items-center space-x-2 px-1 bg-transparent">
                      <CopyPlus size={16} strokeWidth={2} />
                      <span>Clone Control</span>
                    </button>
                  </Link>
                )}
              </>
            }
          />
          {(canEdit(permission?.roles) || canDelete(permission?.roles)) && (
            <div className="flex gap-2">
              {canEdit(permission?.roles) && (
                <Button type="button" variant="secondary" className="p-1! h-8 " onClick={(e) => handleEdit(e)} aria-label="Edit control">
                  <PencilIcon size={16} strokeWidth={2} />
                </Button>
              )}
              {canDelete(permission?.roles) && <DeleteControlDialog controlId={control.id} refCode={control.refCode} />}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const mainContent = (
    <div className="space-y-6 p-2">
      <div className="flex justify-between items-start">
        <TitleField
          isEditAllowed={!isSourceFramework && canEdit(permission?.roles)}
          isEditing={isEditing}
          initialValue={initialValues.title}
          handleUpdate={(val) => handleUpdateField(val as UpdateControlInput)}
          referenceFramework={control.referenceFramework}
        />
        {isEditing && isSourceFramework && (
          <div className="w-3/5 flex items-start gap-2 border rounded-lg p-1 bg-card">
            <InfoIcon size={14} className="mt-1 shrink-0" />
            <p>
              This control was created via a reference framework and the details are not editable. If you need to edit it, consider{' '}
              <Link className="text-blue-500" href={`/controls/${id}/create-subcontrol`}>
                creating a subcontrol
              </Link>
              &nbsp;or&nbsp;
              <Link className="text-blue-500" href={`/controls/create-control?mapControlId=${id}`}>
                creating a new control
              </Link>
              &nbsp;and linking it.
            </p>
          </div>
        )}
      </div>
      <DescriptionField
        isEditing={isEditing}
        initialValue={initialValues.descriptionJSON ?? initialValues.description}
        isEditAllowed={!isSourceFramework && canEdit(permission?.roles)}
        discussionData={discussionData?.control}
      />
      <ControlObjectivesSection controlObjectives={control.controlObjectives} />
      <ControlImplementationsSection controlImplementations={control.controlImplementations} />
      <ControlEvidenceTable
        control={{
          displayID: control?.refCode,
          controlID: control.id,
          controlRefCodes: [control?.refCode],
          referenceFramework: {
            [control?.id ?? 'default']: control?.referenceFramework ?? '',
          },
          programDisplayIDs: (associationsData?.control?.programs?.edges?.map((e) => e?.node?.name).filter(Boolean) as string[]) ?? [],
          objectAssociations: {
            controlIDs: [control?.id],
            programIDs: (associationsData?.control?.programs?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
            controlObjectiveIDs: (control?.controlObjectives?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
          },
          objectAssociationsDisplayIDs: [
            ...((associationsData?.control?.programs?.edges?.map((e) => e?.node?.displayID).filter(Boolean) as string[]) ?? []),
            ...((control?.controlObjectives?.edges?.map((e) => e?.node?.displayID).filter(Boolean) as string[]) ?? []),
            ...(control.refCode ? [control.refCode] : []),
          ],
        }}
        evidences={control.evidence?.edges?.filter((e): e is EvidenceEdge => !!e && !!e.node) || []}
      />
      <SubcontrolsTable subcontrols={control.subcontrols?.edges || []} totalCount={control.subcontrols.totalCount} />
    </div>
  )

  const sidebarContent = (
    <>
      {memoizedCenterNode && <ObjectAssociationSwitch controlId={data?.control.id} sections={memoizedSections} centerNode={memoizedCenterNode} canEdit={canEdit(permission?.roles)} />}

      <PropertiesCard data={control as Control} isEditing={isEditing} handleUpdate={(val) => handleUpdateField(val as UpdateControlInput)} canEdit={canEdit(permission?.roles)} />
      <ControlCommentsCard />
      <RelatedControls canCreate={canCreate(orgPermission?.roles, AccessEnum.CanCreateMappedControl)} refCode={control.refCode} sourceFramework={control.referenceFramework} />
      {hasInfoData && (
        <InfoCard
          implementationGuidance={control.implementationGuidance}
          exampleEvidence={control.exampleEvidence}
          controlQuestions={control.controlQuestions}
          assessmentMethods={control.assessmentMethods}
          assessmentObjectives={control.assessmentObjectives}
          showInfoDetails={showInfoDetails}
        />
      )}
    </>
  )

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Controls - ${data.control.refCode}`}</title>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <SlideBarLayout sidebarTitle="Details" sidebarContent={sidebarContent} menu={menuComponent} slideOpen={isEditing} minWidth={430}>
            {mainContent}
          </SlideBarLayout>
        </form>
      </FormProvider>

      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={navGuard.reject} />

      <Sheet open={showSheet} onOpenChange={handleSheetClose}>
        <SheetContent
          header={
            <SheetHeader>
              <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={() => handleSheetClose(false)} />
              <SheetTitle>{sheetData?.refCode}</SheetTitle>
            </SheetHeader>
          }
        >
          <div className="py-4">{sheetData?.content}</div>
        </SheetContent>
      </Sheet>

      <Dialog open={showAskAIDialog} onOpenChange={setShowAskAIDialog}>
        <DialogContent className="max-w-3xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={20} />
              Ask AI about this Control
            </DialogTitle>
            <DialogDescription>Ask questions or get suggestions about {control?.refCode}</DialogDescription>
          </DialogHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto pr-4">
            <div className="space-y-4 py-4">
              {chatHistory.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Sparkles size={40} className="mx-auto mb-2 opacity-50" />
                  <p>Start a conversation by asking a question about this control</p>
                </div>
              ) : (
                chatHistory.map((message, index) => (
                  <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 whitespace-pre-wrap break-words">{message.content}</div>
                        {message.role === 'assistant' && (
                          <Button type="button" variant="outline" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => handleCopyMessage(message.content)}>
                            {isCopied ? <Check size={14} /> : <Copy size={14} />}
                          </Button>
                        )}
                      </div>
                      <div className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))
              )}
              {isLoadingAI && (
                <div className="flex gap-3 justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse">Thinking...</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <Textarea
              placeholder="Ask a question... (Press Enter to send, Shift+Enter for new line)"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              className="w-full resize-none"
              disabled={isLoadingAI}
            />
            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" size="sm" onClick={handleCloseAIDialog}>
                Close
              </Button>
              <div className="flex gap-2">
                {chatHistory.length > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={handleClearChat}>
                    Clear Chat
                  </Button>
                )}
                <Button type="button" onClick={handleAskAI} disabled={isLoadingAI || !aiPrompt.trim()} size="sm">
                  {isLoadingAI ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EvidenceDetailsSheet controlId={id} />
    </>
  )
}

export default ControlDetailsPage
