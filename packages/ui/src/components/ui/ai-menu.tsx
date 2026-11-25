'use client'

import * as React from 'react'

import cloneDeep from 'lodash/cloneDeep.js'

import { withAIBatch } from '@platejs/ai'
import { AIChatPlugin, AIPlugin, acceptAISuggestions, useEditorChat, useLastAssistantMessage } from '@platejs/ai/react'
import { getTransientCommentKey } from '@platejs/comment'
import { BlockSelectionPlugin, useIsSelecting } from '@platejs/selection/react'
import { getTransientSuggestionKey } from '@platejs/suggestion'
import { Command as CommandPrimitive } from 'cmdk'
import { Album, BadgeHelp, BookOpenCheck, Check, CornerUpLeft, FeatherIcon, ListEnd, ListMinus, ListPlus, Loader2Icon, PauseIcon, PenLine, SmileIcon, Wand, X } from 'lucide-react'
import { type Descendant, type NodeEntry, type SlateEditor, type TRange, ElementApi, isHotkey, KEYS, NodeApi, PathApi, TextApi } from 'platejs'
import { useEditorPlugin, useFocusedLast, useHotkeys, usePluginOption } from 'platejs/react'
import { type PlateEditor, useEditorRef } from 'platejs/react'

import { Button } from '@repo/ui/components/ui/button.tsx'
import { Button as ActionButton } from '@repo/ui/button'
import { Command, CommandGroup, CommandItem, CommandList } from '@repo/ui/command'
import { Popover, PopoverAnchor, PopoverContent } from '@repo/ui/components/ui/popover.tsx'
import { cn } from '@repo/ui/lib/utils'
import { commentPlugin } from '@repo/ui/components/editor/plugins/comment-kit.tsx'

import { discussionPlugin, type TDiscussion } from '@repo/ui/components/editor/plugins/discussion-kit.tsx'
import { useSaveDiscussion } from '@repo/ui/components/editor/use-save-discussion.ts'
import { useNotification } from 'console/src/hooks/useNotification'
import { parseErrorMessage } from 'console/src/utils/graphQlErrorMatcher'

import { AIChatEditor } from './ai-chat-editor'
import { useCanComment } from './comment-toolbar-button'

export function AIMenu() {
  const { api, editor } = useEditorPlugin(AIChatPlugin)
  const mode = usePluginOption(AIChatPlugin, 'mode')
  const toolName = usePluginOption(AIChatPlugin, 'toolName')

  const streaming = usePluginOption(AIChatPlugin, 'streaming')
  const isSelecting = useIsSelecting()
  const isFocusedLast = useFocusedLast()
  const open = usePluginOption(AIChatPlugin, 'open') && isFocusedLast
  const [value, setValue] = React.useState('')

  const [input, setInput] = React.useState('')

  const chat = usePluginOption(AIChatPlugin, 'chat')

  const { messages, status } = chat
  const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null)
  const anchor = React.useMemo(() => anchorElement && createBlockAnchor(editor, anchorElement), [anchorElement, editor])
  const [isEditAnchored, setIsEditAnchored] = React.useState(false)

  const content = useLastAssistantMessage()?.parts.find((part) => part.type === 'text')?.text

  React.useEffect(() => {
    if (!streaming) return

    const anchorTimer = setTimeout(() => {
      const anchorEntry = api.aiChat.node({ anchor: true })
      const dom = anchorEntry && editor.api.toDOMNode(anchorEntry[0])
      if (dom) setAnchorElement(dom)
    }, 0)

    return () => clearTimeout(anchorTimer)
  }, [api.aiChat, editor, streaming])

  const setOpen = (open: boolean) => {
    if (open) {
      api.aiChat.show()
    } else {
      api.aiChat.hide()
    }
  }

  const show = (anchorElement: HTMLElement) => {
    setAnchorElement(anchorElement)
    setOpen(true)
  }

  useEditorChat({
    onOpenBlockSelection: (blocks: NodeEntry[]) => {
      // @ts-ignore – PlateJS typing is incorrect here
      show(editor.api.toDOMNode(blocks.at(-1)![0])!)
    },
    onOpenChange: (open) => {
      if (!open) {
        setAnchorElement(null)
        setInput('')
      }
    },
    onOpenCursor: () => {
      const [ancestor] = editor.api.block({ highest: true })!

      if (!editor.api.isAt({ end: true }) && !editor.api.isEmpty(ancestor)) {
        editor.getApi(BlockSelectionPlugin).blockSelection.set(ancestor.id as string)
      }

      show(editor.api.toDOMNode(ancestor)!)
    },
    onOpenSelection: () => {
      // @ts-ignore – PlateJS typing is incorrect here
      show(editor.api.toDOMNode(editor.api.blocks().at(-1)![0])!)
    },
  })

  useHotkeys('esc', () => {
    api.aiChat.stop()
  })

  const isLoading = status === 'streaming' || status === 'submitted'
  const isEditing = toolName === 'edit' && mode === 'chat'

  React.useEffect(() => {
    if (!isEditing || isLoading) {
      setIsEditAnchored(false)
      return
    }

    let anchorTimer: ReturnType<typeof setTimeout>

    const anchorToResult = () => {
      const suggestionEntry = editor.api.node({
        at: [],
        reverse: true,
        match: (n) => !!n[KEYS.suggestion] && !!n[getTransientSuggestionKey()],
      })
      const anchorPath = suggestionEntry?.[1] ?? editor.getApi(BlockSelectionPlugin).blockSelection.getNodes({ selectionFallback: true, sort: true }).at(-1)?.[1]
      const block = anchorPath && editor.api.block({ at: anchorPath, highest: true })
      const dom = block && editor.api.toDOMNode(block[0])
      if (block && !dom) {
        anchorTimer = setTimeout(anchorToResult, 16)
        return
      }

      if (dom) {
        scrollMenuIntoView(dom)
        setAnchorElement(dom)
      }
      setIsEditAnchored(true)
    }

    anchorTimer = setTimeout(anchorToResult, 0)

    return () => clearTimeout(anchorTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  React.useEffect(() => {
    if (isLoading || mode !== 'insert' || !messages?.length) return

    const scrollTimer = setTimeout(() => anchor && scrollMenuIntoView(anchor.getElement()), 100)
    return () => clearTimeout(scrollTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  if (isLoading && mode === 'insert') return null

  if (toolName === 'comment') return null

  if (isEditing && !isEditAnchored) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor virtualRef={{ current: anchor! }} />

      <PopoverContent
        className="border-none bg-transparent p-0 shadow-none"
        style={{
          width: anchor?.getWidth(),
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault()

          api.aiChat.hide()
        }}
        align="center"
        side="bottom"
      >
        <Command className="w-full rounded-lg border shadow-md" value={value} onValueChange={setValue}>
          {mode === 'chat' && isSelecting && content && toolName === 'generate' && <AIChatEditor content={content} />}

          {isLoading ? (
            <div className="flex grow select-none items-center gap-2 p-2 text-muted-foreground text-sm">
              <Loader2Icon className="size-4 animate-spin" />
              {messages.length > 1 ? 'Editing...' : 'Thinking...'}
            </div>
          ) : (
            <CommandPrimitive.Input
              className={cn(
                'flex h-9 w-full min-w-0 border-input bg-transparent px-3 py-1 text-base outline-none transition-[color,box-shadow] placeholder:text-muted-foreground md:text-sm dark:bg-input/30',
                'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
                'border-b focus-visible:ring-transparent',
              )}
              value={input}
              onKeyDown={(e) => {
                if (isHotkey('backspace')(e) && input.length === 0) {
                  e.preventDefault()
                  api.aiChat.hide()
                }
                if (isHotkey('enter')(e) && !e.shiftKey && !value) {
                  e.preventDefault()
                  void api.aiChat.submit(input)
                  setInput('')
                }
              }}
              onValueChange={setInput}
              placeholder="Ask AI anything..."
              data-plate-focus
              autoFocus
            />
          )}

          {!isLoading && (
            <CommandList>
              <AIMenuItems input={input} setInput={setInput} setValue={setValue} />
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type EditorChatState = 'cursorCommand' | 'cursorSuggestion' | 'selectionCommand' | 'selectionSuggestion'

const AICommentIcon = () => (
  <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 0h24v24H0z" fill="none" stroke="none" />
    <path d="M8 9h8" />
    <path d="M8 13h4.5" />
    <path d="M10 19l-1 -1h-3a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v4.5" />
    <path d="M17.8 20.817l-2.172 1.138a.392 .392 0 0 1 -.568 -.41l.415 -2.411l-1.757 -1.707a.389 .389 0 0 1 .217 -.665l2.428 -.352l1.086 -2.193a.392 .392 0 0 1 .702 0l1.086 2.193l2.428 .352a.39 .39 0 0 1 .217 .665l-1.757 1.707l.414 2.41a.39 .39 0 0 1 -.567 .411l-2.172 -1.138z" />
  </svg>
)

const TABLE_PART_TYPES: string[] = [KEYS.tr, KEYS.td, KEYS.th]

const getSharedBlockPath = (editor: PlateEditor, { anchor, focus }: TRange) =>
  [...NodeApi.levels(editor, PathApi.common(anchor.path, focus.path), { reverse: true })].find(
    ([node, path]) => path.length > 0 && ElementApi.isElement(node) && editor.api.isBlock(node) && !TABLE_PART_TYPES.includes(node.type),
  )?.[1]

const insertSuggestionBelow = (editor: PlateEditor) => {
  const { chatNodes, chatSelection } = editor.getOptions(AIChatPlugin)
  const selectedBlocks = editor.getApi(BlockSelectionPlugin).blockSelection.getNodes()
  const isBlockSelection = selectedBlocks.length > 0 || !chatSelection
  const sourcePath = isBlockSelection ? selectedBlocks[0]?.[1] : getSharedBlockPath(editor, chatSelection)
  const parent = sourcePath && NodeApi.parent(editor, sourcePath)
  const selectedNodes = new Set<Descendant>(selectedBlocks.map(([block]) => block))
  const suggestedBlocks = parent?.children.filter((block) => selectedNodes.has(block) || [...NodeApi.nodes(block)].some(([node]) => getTransientSuggestionKey() in node)) ?? []

  editor.getTransforms(AIPlugin).ai.undo()

  const lastBlockPath = isBlockSelection ? editor.api.node({ at: [], id: chatNodes.at(-1)?.id as string })?.[1] : sourcePath

  if (suggestedBlocks.length > 0 && lastBlockPath) {
    const insertPath = PathApi.next(lastBlockPath)
    const countSiblings = () => NodeApi.parent(editor, insertPath)?.children.length ?? 0
    const siblingCount = countSiblings()

    withAIBatch(
      editor,
      () => {
        editor.tf.insertNodes(cloneDeep(suggestedBlocks), { at: insertPath })
        acceptAISuggestions(editor)
      },
      { split: true },
    )

    const insertedIds = Array.from({ length: countSiblings() - siblingCount }, (_, index) => editor.api.node([...insertPath.slice(0, -1), insertPath[insertPath.length - 1] + index])?.[0].id as string)
    editor.getApi(BlockSelectionPlugin).blockSelection.set(insertedIds)
  }

  editor.getApi(AIChatPlugin).aiChat.hide({ focus: false })
}

const createBlockAnchor = (editor: PlateEditor, element: HTMLElement) => {
  const block = editor.api.toSlateNode(element)
  let current = element

  const getElement = () => {
    if (!current.isConnected && block) {
      const blockEntry = editor.api.node({ at: [], match: (node) => node === block }) ?? editor.api.node({ at: [], id: block.id as string, reverse: true })
      current = (blockEntry && editor.api.toDOMNode(blockEntry[0])) ?? current
    }
    return current
  }

  return {
    contextElement: editor.api.toDOMNode(editor) ?? element,
    getBoundingClientRect: () => getElement().getBoundingClientRect(),
    getElement,
    getWidth: () => getElement().offsetWidth,
  }
}

const MENU_SPACE_PX = 260

const scrollMenuIntoView = (element: HTMLElement) => {
  if (window.innerHeight - element.getBoundingClientRect().bottom >= MENU_SPACE_PX) return

  element.style.scrollMarginBottom = `${MENU_SPACE_PX}px`
  element.scrollIntoView({ block: 'end' })
  element.style.scrollMarginBottom = ''
}

const aiChatItems = {
  accept: {
    icon: <Check />,
    label: 'Accept',
    value: 'accept',
    onSelect: ({ aiEditor, editor }) => {
      const { mode, toolName } = editor.getOptions(AIChatPlugin)

      if (mode === 'chat' && toolName === 'generate') {
        return editor.getTransforms(AIChatPlugin).aiChat.replaceSelection(aiEditor)
      }

      editor.getTransforms(AIChatPlugin).aiChat.accept()
      editor.tf.focus({ edge: 'end' })
    },
  },
  comment: {
    icon: <AICommentIcon />,
    label: 'Comment',
    value: 'comment',
    onSelect: ({ editor, input }) => {
      editor.getApi(AIChatPlugin).aiChat.submit(input, {
        mode: 'insert',
        prompt: 'Please comment on the following content and provide reasonable and meaningful feedback.',
        toolName: 'comment',
      })
    },
  },
  continueWrite: {
    icon: <PenLine />,
    label: 'Continue writing',
    value: 'continueWrite',
    onSelect: ({ editor, input }) => {
      const ancestorNode = editor.api.block({ highest: true })

      if (!ancestorNode) return

      const isEmpty = NodeApi.string(ancestorNode[0]).trim().length === 0

      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        mode: 'insert',
        prompt: isEmpty
          ? `<Document>
{editor}
</Document>
Start writing a new paragraph AFTER <Document> ONLY ONE SENTENCE`
          : 'Continue writing AFTER <Block> ONLY ONE SENTENCE. DONT REPEAT THE TEXT.',
        toolName: 'generate',
      })
    },
  },
  discard: {
    icon: <X />,
    label: 'Discard',
    shortcut: 'Escape',
    value: 'discard',
    onSelect: ({ editor }) => {
      editor.getTransforms(AIPlugin).ai.undo()
      editor.getApi(AIChatPlugin).aiChat.hide()
    },
  },
  emojify: {
    icon: <SmileIcon />,
    label: 'Emojify',
    value: 'emojify',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        prompt: 'Emojify',
        toolName: 'edit',
      })
    },
  },
  explain: {
    icon: <BadgeHelp />,
    label: 'Explain',
    value: 'explain',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        prompt: {
          default: 'Explain {editor}',
          selecting: 'Explain',
        },
        toolName: 'generate',
      })
    },
  },
  fixSpelling: {
    icon: <Check />,
    label: 'Fix spelling & grammar',
    value: 'fixSpelling',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        prompt: 'Fix spelling and grammar',
        toolName: 'edit',
      })
    },
  },
  generateMarkdownSample: {
    icon: <BookOpenCheck />,
    label: 'Generate Markdown sample',
    value: 'generateMarkdownSample',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        prompt: 'Generate a markdown sample',
        toolName: 'generate',
      })
    },
  },
  generateMdxSample: {
    icon: <BookOpenCheck />,
    label: 'Generate MDX sample',
    value: 'generateMdxSample',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        prompt: 'Generate a mdx sample',
        toolName: 'generate',
      })
    },
  },
  improveWriting: {
    icon: <Wand />,
    label: 'Improve writing',
    value: 'improveWriting',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        prompt: 'Improve the writing',
        toolName: 'edit',
      })
    },
  },
  insertBelow: {
    icon: <ListEnd />,
    label: 'Insert below',
    value: 'insertBelow',
    onSelect: ({ aiEditor, editor }) => {
      if (editor.getOption(AIChatPlugin, 'toolName') === 'edit') return insertSuggestionBelow(editor)

      /** Format: 'none' Fix insert table */
      void editor.getTransforms(AIChatPlugin).aiChat.insertBelow(aiEditor, { format: 'none' })
    },
  },
  makeLonger: {
    icon: <ListPlus />,
    label: 'Make longer',
    value: 'makeLonger',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        prompt: 'Make longer',
        toolName: 'edit',
      })
    },
  },
  makeShorter: {
    icon: <ListMinus />,
    label: 'Make shorter',
    value: 'makeShorter',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        prompt: 'Make shorter',
        toolName: 'edit',
      })
    },
  },
  replace: {
    icon: <Check />,
    label: 'Replace selection',
    value: 'replace',
    onSelect: ({ aiEditor, editor }) => {
      void editor.getTransforms(AIChatPlugin).aiChat.replaceSelection(aiEditor)
    },
  },
  simplifyLanguage: {
    icon: <FeatherIcon />,
    label: 'Simplify language',
    value: 'simplifyLanguage',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        prompt: 'Simplify the language',
        mode: 'chat',
        toolName: 'edit',
      })
    },
  },
  summarize: {
    icon: <Album />,
    label: 'Add a summary',
    value: 'summarize',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        mode: 'insert',
        prompt: {
          default: 'Summarize {editor}',
          selecting: 'Summarize',
        },
        toolName: 'generate',
      })
    },
  },
  tryAgain: {
    icon: <CornerUpLeft />,
    label: 'Try again',
    value: 'tryAgain',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.reload()
    },
  },
} satisfies Record<
  string,
  {
    icon: React.ReactNode
    label: string
    value: string
    component?: React.ComponentType<{ menuState: EditorChatState }>
    filterItems?: boolean
    items?: { label: string; value: string }[]
    shortcut?: string
    onSelect?: ({ aiEditor, editor, input }: { aiEditor: SlateEditor; editor: PlateEditor; input: string }) => void
  }
>

const menuStateItems: Record<
  EditorChatState,
  {
    items: (typeof aiChatItems)[keyof typeof aiChatItems][]
    heading?: string
  }[]
> = {
  cursorCommand: [
    {
      items: [aiChatItems.comment, aiChatItems.generateMdxSample, aiChatItems.generateMarkdownSample, aiChatItems.continueWrite, aiChatItems.summarize, aiChatItems.explain],
    },
  ],
  cursorSuggestion: [
    {
      items: [aiChatItems.accept, aiChatItems.discard, aiChatItems.tryAgain],
    },
  ],
  selectionCommand: [
    {
      items: [aiChatItems.improveWriting, aiChatItems.comment, aiChatItems.emojify, aiChatItems.makeLonger, aiChatItems.makeShorter, aiChatItems.fixSpelling, aiChatItems.simplifyLanguage],
    },
  ],
  selectionSuggestion: [
    {
      items: [aiChatItems.accept, aiChatItems.discard, aiChatItems.insertBelow, aiChatItems.tryAgain],
    },
  ],
}

export const AIMenuItems = ({ input, setInput, setValue }: { input: string; setInput: (value: string) => void; setValue: (value: string) => void }) => {
  const editor = useEditorRef()
  const { messages } = usePluginOption(AIChatPlugin, 'chat')
  const aiEditor = usePluginOption(AIChatPlugin, 'aiEditor')!
  const isSelecting = useIsSelecting()
  const canComment = useCanComment()

  const menuState = React.useMemo(() => {
    if (messages && messages.length > 0) {
      return isSelecting ? 'selectionSuggestion' : 'cursorSuggestion'
    }

    return isSelecting ? 'selectionCommand' : 'cursorCommand'
  }, [isSelecting, messages])

  const menuGroups = React.useMemo(() => {
    return menuStateItems[menuState].map((group) => ({ ...group, items: group.items.filter((item) => canComment || item !== aiChatItems.comment) }))
  }, [canComment, menuState])

  React.useEffect(() => {
    if (menuGroups.length > 0 && menuGroups[0].items.length > 0) {
      setValue(menuGroups[0].items[0].value)
    }
  }, [menuGroups, setValue])

  return (
    <>
      {menuGroups.map((group, index) => (
        <CommandGroup key={index} heading={group.heading}>
          {group.items.map((menuItem) => (
            <CommandItem
              key={menuItem.value}
              className="[&_svg]:text-muted-foreground"
              value={menuItem.value}
              onSelect={() => {
                menuItem.onSelect?.({
                  aiEditor,
                  editor,
                  input,
                })
                setInput('')
              }}
            >
              {menuItem.icon}
              <span>{menuItem.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      ))}
    </>
  )
}

export function AILoadingBar() {
  const editor = useEditorRef()

  const toolName = usePluginOption(AIChatPlugin, 'toolName')
  const chat = usePluginOption(AIChatPlugin, 'chat')
  const mode = usePluginOption(AIChatPlugin, 'mode')

  const { status } = chat

  const { api } = useEditorPlugin(AIChatPlugin)

  const isLoading = status === 'streaming' || status === 'submitted'

  const { addDiscussion, saveDocument } = useSaveDiscussion()
  const { errorNotification } = useNotification()
  const pendingDiscussions = usePluginOption(discussionPlugin, 'pendingAiDiscussions')
  const [isSavingComments, setIsSavingComments] = React.useState(false)
  const [hasUnsavedMarks, setHasUnsavedMarks] = React.useState(false)
  const isSavingCommentsRef = React.useRef(false)

  const setPendingDiscussions = (discussions: TDiscussion[]) => editor.setOption(discussionPlugin, 'pendingAiDiscussions', discussions)

  const clearTransientMarks = () => editor.tf.unsetNodes([getTransientCommentKey()], { at: [], match: (n) => TextApi.isText(n) && !!n[getTransientCommentKey()] })

  const acceptComments = async () => {
    if (isSavingCommentsRef.current) return

    api.aiChat.hide({ focus: false })
    isSavingCommentsRef.current = true
    setIsSavingComments(true)
    try {
      for (const discussion of pendingDiscussions) {
        await addDiscussion(discussion.id, discussion.comments[0].contentRich)
        setPendingDiscussions(editor.getOption(discussionPlugin, 'pendingAiDiscussions').filter(({ id }) => id !== discussion.id))
        setHasUnsavedMarks(true)
      }

      clearTransientMarks()
      await saveDocument()
      setHasUnsavedMarks(false)
    } catch (error) {
      errorNotification({ title: 'Failed to save AI comments', description: parseErrorMessage(error) })
    } finally {
      isSavingCommentsRef.current = false
      setIsSavingComments(false)
    }
  }

  const rejectComments = () => {
    const rejectedIds = new Set(pendingDiscussions.map((discussion) => discussion.id))

    rejectedIds.forEach((id) => editor.getTransforms(commentPlugin).comment.unsetMark({ id }))
    clearTransientMarks()
    editor.setOption(
      discussionPlugin,
      'discussions',
      editor.getOption(discussionPlugin, 'discussions').filter((discussion) => !rejectedIds.has(discussion.id)),
    )
    setPendingDiscussions([])
    api.aiChat.hide()
  }

  useHotkeys('esc', () => {
    api.aiChat.stop()
  })

  if (isLoading && (mode === 'insert' || toolName === 'comment' || (toolName === 'edit' && mode === 'chat'))) {
    return (
      <div
        className={cn(
          '-translate-x-1/2 fixed bottom-4 left-1/2 z-20 flex items-center gap-3 rounded-md border border-border bg-muted px-3 py-1.5 text-muted-foreground text-sm shadow-md transition-all duration-300',
        )}
      >
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <span>{status === 'submitted' ? 'Thinking...' : 'Writing...'}</span>
        <Button size="sm" variant="ghost" className="flex items-center gap-1 text-xs" onClick={() => api.aiChat.stop()}>
          <PauseIcon className="h-4 w-4" />
          Stop
          <kbd className="ml-1 rounded bg-border px-1 font-mono text-[10px] text-muted-foreground shadow-sm">Esc</kbd>
        </Button>
      </div>
    )
  }

  if (pendingDiscussions.length > 0 || hasUnsavedMarks) {
    return (
      <div className="-translate-x-1/2 fixed bottom-4 left-1/2 z-50 flex items-center gap-3 rounded-xl border border-border/50 bg-popover p-3 shadow-xl">
        <ActionButton disabled={isSavingComments} loading={isSavingComments} onClick={() => void acceptComments()}>
          Accept
        </ActionButton>

        <ActionButton variant="secondary" disabled={isSavingComments || pendingDiscussions.length === 0} onClick={rejectComments}>
          Reject
        </ActionButton>
      </div>
    )
  }

  return null
}
