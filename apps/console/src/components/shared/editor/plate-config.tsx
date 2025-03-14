import Prism from 'prismjs'

import { withProps } from '@udecode/cn'
import { CodeBlockPlugin, CodeLinePlugin, CodeSyntaxPlugin } from '@udecode/plate-code-block/react'
import { HeadingPlugin, TocPlugin } from '@udecode/plate-heading/react'
import { HorizontalRulePlugin } from '@udecode/plate-horizontal-rule/react'
import { LinkPlugin } from '@udecode/plate-link/react'
import { ImagePlugin, MediaEmbedPlugin } from '@udecode/plate-media/react'
import { MentionPlugin } from '@udecode/plate-mention/react'
import { withPlaceholders } from '@repo/ui/plate-ui/placeholder'
import { withDraggables } from '@repo/ui/plate-ui/with-draggables'
import { autoformatPlugin } from '@repo/ui/plate-ui/autoformat-plugin'
import { TogglePlugin } from '@udecode/plate-toggle/react'
import { ColumnPlugin, ColumnItemPlugin } from '@udecode/plate-layout/react'
import { TablePlugin, TableRowPlugin, TableCellPlugin, TableCellHeaderPlugin } from '@udecode/plate-table/react'
import { DatePlugin } from '@udecode/plate-date/react'
import { CaptionPlugin } from '@udecode/plate-caption/react'
import { isCodeBlockEmpty, isSelectionAtCodeBlockStart, unwrapCodeBlock } from '@udecode/plate-code-block'

import { BoldPlugin, ItalicPlugin, UnderlinePlugin, StrikethroughPlugin, CodePlugin, SubscriptPlugin, SuperscriptPlugin } from '@udecode/plate-basic-marks/react'
import { BaseFontColorPlugin, BaseFontFamilyPlugin, BaseFontBackgroundColorPlugin, BaseFontSizePlugin } from '@udecode/plate-font'
import { HistoryPlugin, isBlockAboveEmpty, isSelectionAtBlockStart } from '@udecode/plate-common'
import { HighlightPlugin } from '@udecode/plate-highlight/react'
import { KbdPlugin } from '@udecode/plate-kbd/react'
import { BaseAlignPlugin } from '@udecode/plate-alignment'
import { IndentPlugin } from '@udecode/plate-indent/react'
import { IndentListPlugin } from '@udecode/plate-indent-list/react'
import { BaseLineHeightPlugin } from '@udecode/plate-line-height'
import { BlockSelectionPlugin, BlockMenuPlugin } from '@udecode/plate-selection/react'
import { EmojiPlugin } from '@udecode/plate-emoji/react'
import { ExitBreakPlugin, SoftBreakPlugin } from '@udecode/plate-break/react'
import { NodeIdPlugin } from '@udecode/plate-node-id'
import { ResetNodePlugin } from '@udecode/plate-reset-node/react'
import { TabbablePlugin } from '@udecode/plate-tabbable/react'
import { TrailingBlockPlugin } from '@udecode/plate-trailing-block'
import { DndPlugin } from '@udecode/plate-dnd'
import { DeletePlugin } from '@udecode/plate-select'
import { BaseSlashPlugin } from '@udecode/plate-slash-command'
import { DocxPlugin } from '@udecode/plate-docx'
import { CsvPlugin } from '@udecode/plate-csv'
import { MarkdownPlugin } from '@udecode/plate-markdown'
import { JuicePlugin } from '@udecode/plate-juice'
import { HEADING_KEYS } from '@udecode/plate-heading'
import { BlockquoteElement } from '@repo/ui/plate-ui/blockquote-element'
import { CodeBlockElement } from '@repo/ui/plate-ui/code-block-element'
import { CodeLineElement } from '@repo/ui/plate-ui/code-line-element'
import { CodeSyntaxLeaf } from '@repo/ui/plate-ui/code-syntax-leaf'
import { HrElement } from '@repo/ui/plate-ui/hr-element'
import { ImageElement } from '@repo/ui/plate-ui/image-element'
import { LinkElement } from '@repo/ui/plate-ui/link-element'
import { LinkFloatingToolbar } from '@repo/ui/plate-ui/link-floating-toolbar'
import { ToggleElement } from '@repo/ui/plate-ui/toggle-element'
import { ColumnGroupElement } from '@repo/ui/plate-ui/column-group-element'
import { ColumnElement } from '@repo/ui/plate-ui/column-element'
import { HeadingElement } from '@repo/ui/plate-ui/heading-element'
import { ParagraphElement } from '@repo/ui/plate-ui/paragraph-element'
import { TableElement } from '@repo/ui/plate-ui/table-element'
import { TableRowElement } from '@repo/ui/plate-ui/table-row-element'
import { TableCellElement, TableCellHeaderElement } from '@repo/ui/plate-ui/table-cell-element'
import { DateElement } from '@repo/ui/plate-ui/date-element'
import { CodeLeaf } from '@repo/ui/plate-ui/code-leaf'
import { HighlightLeaf } from '@repo/ui/plate-ui/highlight-leaf'
import { KbdLeaf } from '@repo/ui/plate-ui/kbd-leaf'
import { ParagraphPlugin, PlateLeaf } from '@udecode/plate-common/react'
import { BlockquotePlugin } from '@udecode/plate-block-quote/react'
import { TodoListPlugin } from '@udecode/plate-list/react'

const resetBlockTypesCommonRule = {
  types: [BlockquotePlugin.key, TodoListPlugin.key],
  defaultType: ParagraphPlugin.key,
}

const resetBlockTypesCodeBlockRule = {
  types: [CodeBlockPlugin.key],
  defaultType: ParagraphPlugin.key,
  onReset: unwrapCodeBlock,
}

const PlateConfig = {
  plugins: [
    ParagraphPlugin,
    BlockquotePlugin,
    CodeBlockPlugin.configure({ options: { prism: Prism } }),
    HeadingPlugin,
    HorizontalRulePlugin,
    LinkPlugin.configure({ render: { afterEditable: () => <LinkFloatingToolbar /> } }),
    ImagePlugin,
    MediaEmbedPlugin,
    MentionPlugin,
    TodoListPlugin,
    TogglePlugin,
    ColumnPlugin,
    TablePlugin.configure({ options: { enableMerging: true } }),
    DatePlugin,
    TocPlugin,
    CaptionPlugin.configure({ options: { plugins: [ImagePlugin, MediaEmbedPlugin] } }),
    BoldPlugin,
    ItalicPlugin,
    UnderlinePlugin,
    StrikethroughPlugin,
    CodePlugin,
    SubscriptPlugin,
    SuperscriptPlugin,
    BaseFontColorPlugin,
    BaseFontBackgroundColorPlugin,
    BaseFontFamilyPlugin,
    BaseFontSizePlugin,
    HighlightPlugin,
    KbdPlugin,
    BaseAlignPlugin.configure({ inject: { targetPlugins: ['p', 'h1', 'h2', 'h3'] } }),
    IndentPlugin.configure({ inject: { targetPlugins: ['p', 'h1', 'h2', 'h3'] } }),
    IndentListPlugin.configure({ inject: { targetPlugins: ['p', 'h1', 'h2', 'h3'] } }),
    BaseLineHeightPlugin.configure({
      inject: {
        nodeProps: {
          defaultNodeValue: 1.5,
          validNodeValues: [1, 1.2, 1.5, 2, 3],
        },
        targetPlugins: ['p', 'h1', 'h2', 'h3'],
      },
    }),
    autoformatPlugin,
    BlockSelectionPlugin,
    EmojiPlugin,
    ExitBreakPlugin.configure({
      options: {
        rules: [
          {
            hotkey: 'mod+enter',
          },
          {
            before: true,
            hotkey: 'mod+shift+enter',
          },
          {
            hotkey: 'enter',
            level: 1,
            query: {
              allow: ['h1', 'h2', 'h3'],
              end: true,
              start: true,
            },
            relative: true,
          },
        ],
      },
    }),
    NodeIdPlugin,
    ResetNodePlugin.configure({
      options: {
        rules: [
          {
            ...resetBlockTypesCommonRule,
            hotkey: 'Enter',
            predicate: isBlockAboveEmpty,
          },
          {
            ...resetBlockTypesCommonRule,
            hotkey: 'Backspace',
            predicate: isSelectionAtBlockStart,
          },
          {
            ...resetBlockTypesCodeBlockRule,
            hotkey: 'Enter',
            predicate: isCodeBlockEmpty,
          },
          {
            ...resetBlockTypesCodeBlockRule,
            hotkey: 'Backspace',
            predicate: isSelectionAtCodeBlockStart,
          },
        ],
      },
    }),
    SoftBreakPlugin.configure({
      options: {
        rules: [
          { hotkey: 'shift+enter' },
          {
            hotkey: 'enter',
            query: {
              allow: ['code_block', 'blockquote', 'td', 'th'],
            },
          },
        ],
      },
    }),
    TabbablePlugin,
    TrailingBlockPlugin.configure({ options: { type: 'p' } }),
    BlockMenuPlugin,
    DndPlugin.configure({ options: { enableScroller: true } }),
    DeletePlugin,
    BaseSlashPlugin,
    DocxPlugin,
    CsvPlugin,
    MarkdownPlugin.configure({ options: { indentList: true } }),
    JuicePlugin,
    HistoryPlugin,
  ],
  override: {
    components: withPlaceholders({
      [BlockquotePlugin.key]: BlockquoteElement,
      [CodeBlockPlugin.key]: CodeBlockElement,
      [CodeLinePlugin.key]: CodeLineElement,
      [CodeSyntaxPlugin.key]: CodeSyntaxLeaf,
      [HorizontalRulePlugin.key]: HrElement,
      [ImagePlugin.key]: ImageElement,
      [LinkPlugin.key]: LinkElement,
      [TogglePlugin.key]: ToggleElement,
      [ColumnPlugin.key]: ColumnGroupElement,
      [ColumnItemPlugin.key]: ColumnElement,
      [HEADING_KEYS.h1]: withProps(HeadingElement, { variant: 'h1' }),
      [HEADING_KEYS.h2]: withProps(HeadingElement, { variant: 'h2' }),
      [HEADING_KEYS.h3]: withProps(HeadingElement, { variant: 'h3' }),
      [HEADING_KEYS.h4]: withProps(HeadingElement, { variant: 'h4' }),
      [HEADING_KEYS.h5]: withProps(HeadingElement, { variant: 'h5' }),
      [HEADING_KEYS.h6]: withProps(HeadingElement, { variant: 'h6' }),
      [ParagraphPlugin.key]: ParagraphElement,
      [TablePlugin.key]: TableElement,
      [TableRowPlugin.key]: TableRowElement,
      [TableCellPlugin.key]: TableCellElement,
      [TableCellHeaderPlugin.key]: TableCellHeaderElement,
      [DatePlugin.key]: DateElement,
      [BoldPlugin.key]: withProps(PlateLeaf, { as: 'strong' }),
      [CodePlugin.key]: CodeLeaf,
      [HighlightPlugin.key]: HighlightLeaf,
      [ItalicPlugin.key]: withProps(PlateLeaf, { as: 'em' }),
      [KbdPlugin.key]: KbdLeaf,
      [StrikethroughPlugin.key]: withProps(PlateLeaf, { as: 's' }),
      [SubscriptPlugin.key]: withProps(PlateLeaf, { as: 'sub' }),
      [SuperscriptPlugin.key]: withProps(PlateLeaf, { as: 'sup' }),
      [UnderlinePlugin.key]: withProps(PlateLeaf, { as: 'u' }),
    }),
  },
}

export default PlateConfig
