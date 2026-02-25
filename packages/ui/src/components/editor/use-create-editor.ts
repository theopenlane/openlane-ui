'use client'
import { type Value, TrailingBlockPlugin } from 'platejs'
import { type TPlateEditor } from 'platejs/react'
import { AIKit } from '@repo/ui/components/editor/plugins/ai-kit.tsx'
import { AlignKit } from '@repo/ui/components/editor/plugins/align-kit.tsx'
import { AutoformatKit } from '@repo/ui/components/editor/plugins/autoformat-kit.tsx'
import { BasicBlocksKit } from '@repo/ui/components/editor/plugins/basic-blocks-kit.tsx'
import { BasicMarksKit } from '@repo/ui/components/editor/plugins/basic-marks-kit.tsx'
import { BlockMenuKit } from '@repo/ui/components/editor/plugins/block-menu-kit.tsx'
import { BlockPlaceholderKit } from '@repo/ui/components/editor/plugins/block-placeholder-kit.tsx'
import { CalloutKit } from '@repo/ui/components/editor/plugins/callout-kit.tsx'
import { CodeBlockKit } from '@repo/ui/components/editor/plugins/code-block-kit.tsx'
import { ColumnKit } from '@repo/ui/components/editor/plugins/column-kit.tsx'
import { CommentKit } from '@repo/ui/components/editor/plugins/comment-kit.tsx'
import { CopilotKit } from '@repo/ui/components/editor/plugins/copilot-kit.tsx'
import { CursorOverlayKit } from '@repo/ui/components/editor/plugins/cursor-overlay-kit.tsx'
import { DateKit } from '@repo/ui/components/editor/plugins/date-kit.tsx'
import { DiscussionKit } from '@repo/ui/components/editor/plugins/discussion-kit.tsx'
import { DndKit } from '@repo/ui/components/editor/plugins/dnd-kit.tsx'
import { DocxKit } from '@repo/ui/components/editor/plugins/docx-kit.tsx'
import { EmojiKit } from '@repo/ui/components/editor/plugins/emoji-kit.tsx'
import { ExitBreakKit } from '@repo/ui/components/editor/plugins/exit-break-kit.tsx'
import { FixedToolbarKit } from '@repo/ui/components/editor/plugins/fixed-toolbar-kit.tsx'
import { FloatingToolbarKit } from '@repo/ui/components/editor/plugins/floating-toolbar-kit.tsx'
import { FontKit } from '@repo/ui/components/editor/plugins/font-kit.tsx'
import { LineHeightKit } from '@repo/ui/components/editor/plugins/line-height-kit.tsx'
import { LinkKit } from '@repo/ui/components/editor/plugins/link-kit.tsx'
import { ListKit } from '@repo/ui/components/editor/plugins/list-kit.tsx'
import { MarkdownKit } from '@repo/ui/components/editor/plugins/markdown-kit.tsx'
import { MathKit } from '@repo/ui/components/editor/plugins/math-kit.tsx'
import { MediaKit } from '@repo/ui/components/editor/plugins/media-kit.tsx'
import { MentionKit } from '@repo/ui/components/editor/plugins/mention-kit.tsx'
import { SlashKit } from '@repo/ui/components/editor/plugins/slash-kit.tsx'
import { SuggestionKit } from '@repo/ui/components/editor/plugins/suggestion-kit.tsx'
import { TableKit } from '@repo/ui/components/editor/plugins/table-kit.tsx'
import { TocKit } from '@repo/ui/components/editor/plugins/toc-kit.tsx'
import { ToggleKit } from '@repo/ui/components/editor/plugins/toggle-kit.tsx'
import { BasicFixedToolbarKit } from '@repo/ui/components/editor/plugins/basic-fixed-toolbar-kit.tsx'
import { BasicFloatingToolbarKit } from '@repo/ui/components/editor/plugins/basic-floating-toolbar-kit.tsx'
import { MinimalisticFixedToolbarKit } from '@repo/ui/components/editor/plugins/minimalistic-fixed-toolbar-kit.tsx'
import { MinimalisticFloatingToolbarKit } from '@repo/ui/components/editor/plugins/minimalistic-floating-toolbar-kit.tsx'
import { createReadOnlyToolbarKit } from './plugins/read-only-toolbar-kit.tsx'

export const EditorKit = [
  /*
  Copilot kit needs to be manually implemented
  ...CopilotKit, */
  // Elements
  ...AIKit,
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...ToggleKit,
  ...TocKit,
  ...MediaKit,
  ...CalloutKit,
  ...ColumnKit,
  ...MathKit,
  ...DateKit,
  ...LinkKit,
  ...MentionKit,
  // Marks
  ...BasicMarksKit,
  ...FontKit,
  // Block Style
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,
  // Collaboration
  ...DiscussionKit,
  ...CommentKit,
  ...SuggestionKit,
  // Editing
  ...SlashKit,
  ...AutoformatKit,
  ...CursorOverlayKit,
  ...BlockMenuKit,
  ...DndKit,
  ...EmojiKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,
  // Parsers
  ...DocxKit,
  ...MarkdownKit,
  // UI
  ...BlockPlaceholderKit,
]

export const MinimalisticKit = [...EditorKit, ...MinimalisticFixedToolbarKit, ...MinimalisticFloatingToolbarKit]

export const BasicKit = [...EditorKit, ...BasicFixedToolbarKit, ...BasicFloatingToolbarKit]

export const AdvancedKit = [...EditorKit, ...FixedToolbarKit, ...FloatingToolbarKit]

export const ReadonlyKit = [...EditorKit]

export type MyEditor = TPlateEditor<Value, (typeof EditorKit)[number]>

export type TPlateEditorVariants = 'basic' | 'standard' | 'advanced' | 'minimal' | 'readonly'

type EditorKitOptions = {
  title?: string
  toolbarClassName?: string
}

export const EditorKitVariant = {
  minimal: (_options?: EditorKitOptions) => MinimalisticKit,
  basic: (_options?: EditorKitOptions) => BasicKit,
  standard: (_options?: EditorKitOptions) => AdvancedKit,
  advanced: (_options?: EditorKitOptions) => AdvancedKit,
  readonly: (options?: EditorKitOptions) => [...EditorKit, ...createReadOnlyToolbarKit({ title: options?.title ?? 'Document', className: options?.toolbarClassName })],
}
