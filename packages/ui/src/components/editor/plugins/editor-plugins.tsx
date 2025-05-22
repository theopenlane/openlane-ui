'use client'

import emojiMartData from '@emoji-mart/data'
import { CalloutPlugin } from '@udecode/plate-callout/react'
import { CodeBlockPlugin } from '@udecode/plate-code-block/react'
import { DatePlugin } from '@udecode/plate-date/react'
import { DocxPlugin } from '@udecode/plate-docx'
import { EmojiPlugin } from '@udecode/plate-emoji/react'
import { FontBackgroundColorPlugin, FontColorPlugin, FontSizePlugin } from '@udecode/plate-font/react'
import { HighlightPlugin } from '@udecode/plate-highlight/react'
import { HorizontalRulePlugin } from '@udecode/plate-horizontal-rule/react'
import { JuicePlugin } from '@udecode/plate-juice'
import { KbdPlugin } from '@udecode/plate-kbd/react'
import { ColumnPlugin } from '@udecode/plate-layout/react'
import { MarkdownPlugin } from '@udecode/plate-markdown'
import { SlashPlugin } from '@udecode/plate-slash-command/react'
import { TogglePlugin } from '@udecode/plate-toggle/react'
import { TrailingBlockPlugin } from '@udecode/plate-trailing-block'

import { AdvancedFixedToolbarPlugin } from './advanced-fixed-toolbar-plugin.tsx'
import { AdvancedFloatingToolbarPlugin } from './advanced-floating-toolbar-plugin.tsx'
import { BasicFloatingToolbarPlugin } from '../../editor/plugins/basic-floating-toolbar-plugin'
import { BlockDiscussion } from '../../plate-ui/block-discussion'
import { SuggestionBelowNodes } from '../../plate-ui/suggestion-line-break'

import { aiPlugins } from './ai-plugins'
import { alignPlugin } from './align-plugin'
import { autoformatPlugin } from './autoformat-plugin'
import { basicNodesPlugins } from './basic-nodes-plugins'
import { blockMenuPlugins } from './block-menu-plugins'
import { commentsPlugin } from './comments-plugin'
import { cursorOverlayPlugin } from './cursor-overlay-plugin'
import { deletePlugins } from './delete-plugins'
import { dndPlugins } from './dnd-plugins'
import { equationPlugins } from './equation-plugins'
import { exitBreakPlugin } from './exit-break-plugin'
import { indentListPlugins } from './indent-list-plugins'
import { lineHeightPlugin } from './line-height-plugin'
import { linkPlugin } from './link-plugin'
import { mediaPlugins } from './media-plugins'
import { mentionPlugin } from './mention-plugin'
import { resetBlockTypePlugin } from './reset-block-type-plugin'
import { skipMarkPlugin } from './skip-mark-plugin'
import { softBreakPlugin } from './soft-break-plugin'
import { suggestionPlugin } from './suggestion-plugin'
import { tablePlugin } from './table-plugin'
import { tocPlugin } from './toc-plugin'
import { BaseEquationPlugin, BaseInlineEquationPlugin } from '@udecode/plate-math'
import { BaseColumnItemPlugin, BaseColumnPlugin } from '@udecode/plate-layout'
import { BaseHeadingPlugin, BaseTocPlugin, HEADING_LEVELS } from '@udecode/plate-heading'
import { BaseAudioPlugin, BaseFilePlugin, BaseImagePlugin, BaseMediaEmbedPlugin, BaseVideoPlugin } from '@udecode/plate-media'
import { BaseParagraphPlugin } from '@udecode/plate'
import { BaseBoldPlugin, BaseCodePlugin, BaseItalicPlugin, BaseStrikethroughPlugin, BaseSubscriptPlugin, BaseSuperscriptPlugin, BaseUnderlinePlugin } from '@udecode/plate-basic-marks'
import { BaseTogglePlugin } from '@udecode/plate-toggle'
import { BaseCommentsPlugin } from '@udecode/plate-comments'
import { BaseMentionPlugin } from '@udecode/plate-mention'
import { BaseHighlightPlugin } from '@udecode/plate-highlight'
import { BaseLineHeightPlugin } from '@udecode/plate-line-height'
import { BaseAlignPlugin } from '@udecode/plate-alignment'
import { BaseFontBackgroundColorPlugin, BaseFontColorPlugin, BaseFontSizePlugin } from '@udecode/plate-font'
import { BaseKbdPlugin } from '@udecode/plate-kbd'
import { BaseHorizontalRulePlugin } from '@udecode/plate-horizontal-rule'
import { BaseTableCellPlugin, BaseTablePlugin, BaseTableRowPlugin } from '@udecode/plate-table'
import { BaseLinkPlugin } from '@udecode/plate-link'
import { TodoLiStatic, TodoMarkerStatic } from '../../plate-ui/indent-todo-marker-static'
import { FireLiComponent, FireMarker } from '../../plate-ui/indent-fire-marker'
import { BaseCodeBlockPlugin } from '@udecode/plate-code-block'
import { BaseIndentListPlugin } from '@udecode/plate-indent-list'
import { BaseIndentPlugin } from '@udecode/plate-indent'
import { BaseBlockquotePlugin } from '@udecode/plate-block-quote'
import { BaseDatePlugin } from '@udecode/plate-date'
import { all, createLowlight } from 'lowlight'
import { BasicFixedToolbarPlugin } from '../../editor/plugins/basic-fixed-toolbar-plugin.tsx'
import { StandardFixedToolbarPlugin } from '../../editor/plugins/standard-fixed-toolbar-plugin.tsx'
import { StandardFloatingToolbarPlugin } from '../../editor/plugins/standard-floating-toolbar-plugin'
import { MinimalFixedToolbarPlugin } from '../../editor/plugins/minimal-fixed-toolbar-plugin.tsx'
import { MinimalFloatingToolbarPlugin } from '../../editor/plugins/minimal-floating-toolbar-plugin.tsx'
import { NodeIdPlugin } from '@udecode/plate-node-id'

const lowlight = createLowlight(all)

export const basePlugins = [
  BaseEquationPlugin,
  BaseInlineEquationPlugin,
  BaseColumnPlugin,
  BaseColumnItemPlugin,
  BaseTocPlugin,
  BaseVideoPlugin,
  BaseAudioPlugin,
  BaseParagraphPlugin,
  BaseHeadingPlugin,
  BaseMediaEmbedPlugin,
  BaseBoldPlugin,
  BaseCodePlugin,
  BaseItalicPlugin,
  BaseStrikethroughPlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseUnderlinePlugin,
  BaseBlockquotePlugin,
  BaseDatePlugin,
  BaseCodeBlockPlugin.configure({
    options: {
      lowlight,
    },
  }),
  BaseIndentPlugin.extend({
    inject: {
      targetPlugins: [BaseParagraphPlugin.key, BaseBlockquotePlugin.key, BaseCodeBlockPlugin.key],
    },
  }),
  BaseIndentListPlugin.extend({
    inject: {
      targetPlugins: [BaseParagraphPlugin.key, ...HEADING_LEVELS, BaseBlockquotePlugin.key, BaseCodeBlockPlugin.key, BaseTogglePlugin.key],
    },
    options: {
      listStyleTypes: {
        fire: {
          liComponent: FireLiComponent,
          markerComponent: FireMarker,
          type: 'fire',
        },
        todo: {
          liComponent: TodoLiStatic,
          markerComponent: TodoMarkerStatic,
          type: 'todo',
        },
      },
    },
  }),
  BaseLinkPlugin,
  BaseTableRowPlugin,
  BaseTablePlugin,
  BaseTableCellPlugin,
  BaseHorizontalRulePlugin,
  BaseFontColorPlugin,
  BaseFontBackgroundColorPlugin,
  BaseFontSizePlugin,
  BaseKbdPlugin,
  BaseAlignPlugin.extend({
    inject: {
      targetPlugins: [BaseParagraphPlugin.key, BaseMediaEmbedPlugin.key, ...HEADING_LEVELS, BaseImagePlugin.key],
    },
  }),
  BaseLineHeightPlugin,
  BaseHighlightPlugin,
  BaseFilePlugin,
  BaseImagePlugin,
  BaseMentionPlugin,
  BaseCommentsPlugin,
  BaseTogglePlugin,
] as const

export const viewPlugins = [
  ...basicNodesPlugins,
  HorizontalRulePlugin,
  linkPlugin,
  DatePlugin,
  mentionPlugin,
  tablePlugin,
  TogglePlugin,
  tocPlugin,
  ...mediaPlugins,
  ...equationPlugins,
  CalloutPlugin,
  ColumnPlugin,

  // Marks
  FontColorPlugin,
  FontBackgroundColorPlugin,
  FontSizePlugin,
  HighlightPlugin,
  KbdPlugin,
  skipMarkPlugin,

  // Block Style
  alignPlugin,
  ...indentListPlugins,
  lineHeightPlugin,

  // Collaboration
  commentsPlugin.configure({
    render: { aboveNodes: BlockDiscussion as any },
  }),
  suggestionPlugin.configure({
    render: { belowNodes: SuggestionBelowNodes as any },
  }),
] as const

export const advancedPlugins = [
  // AI
  //...aiPlugins,

  // Nodes
  ...basicNodesPlugins,
  ...viewPlugins,
  NodeIdPlugin,

  // Functionality
  SlashPlugin.extend({
    options: {
      triggerQuery(editor) {
        return !editor.api.some({
          match: { type: editor.getType(CodeBlockPlugin) },
        })
      },
    },
  }),
  autoformatPlugin,
  cursorOverlayPlugin,
  ...blockMenuPlugins,
  //...dndPlugins,
  EmojiPlugin.configure({ options: { data: emojiMartData as any } }),
  exitBreakPlugin,
  resetBlockTypePlugin,
  ...deletePlugins,
  softBreakPlugin,
  TrailingBlockPlugin,

  // Deserialization
  DocxPlugin,
  MarkdownPlugin.configure({ options: { indentList: true } }),
  JuicePlugin,

  // UI
  AdvancedFixedToolbarPlugin,
  AdvancedFloatingToolbarPlugin,
]

export const basicPlugins = [
  // AI
  //...aiPlugins,

  // Nodes
  ...basicNodesPlugins,
  ...viewPlugins,
  NodeIdPlugin,
  HorizontalRulePlugin,
  linkPlugin,
  tocPlugin,

  // Marks
  FontColorPlugin,
  FontBackgroundColorPlugin,
  FontSizePlugin,
  HighlightPlugin,
  KbdPlugin,
  skipMarkPlugin,

  // Block Style
  alignPlugin,
  ...indentListPlugins,
  lineHeightPlugin,

  // Functionality
  SlashPlugin.extend({
    options: {
      triggerQuery(editor) {
        return !editor.api.some({
          match: { type: editor.getType(CodeBlockPlugin) },
        })
      },
    },
  }),
  autoformatPlugin,
  cursorOverlayPlugin,
  ...blockMenuPlugins,
  //...dndPlugins,
  EmojiPlugin.configure({ options: { data: emojiMartData as any } }),
  exitBreakPlugin,
  resetBlockTypePlugin,
  ...deletePlugins,
  softBreakPlugin,
  TrailingBlockPlugin,

  // Deserialization
  DocxPlugin,
  MarkdownPlugin.configure({ options: { indentList: true } }),
  JuicePlugin,

  // UI
  BasicFixedToolbarPlugin,
  BasicFloatingToolbarPlugin,
]

export const standardPlugins = [
  // AI
  //...aiPlugins,

  // Nodes
  ...basicNodesPlugins,
  ...viewPlugins,
  NodeIdPlugin,
  HorizontalRulePlugin,
  linkPlugin,
  tocPlugin,

  // Marks
  FontColorPlugin,
  FontBackgroundColorPlugin,
  FontSizePlugin,
  HighlightPlugin,
  KbdPlugin,
  skipMarkPlugin,

  // Block Style
  alignPlugin,
  ...indentListPlugins,
  lineHeightPlugin,

  // Functionality
  SlashPlugin.extend({
    options: {
      triggerQuery(editor) {
        return !editor.api.some({
          match: { type: editor.getType(CodeBlockPlugin) },
        })
      },
    },
  }),
  autoformatPlugin,
  cursorOverlayPlugin,
  ...blockMenuPlugins,
  //...dndPlugins,
  EmojiPlugin.configure({ options: { data: emojiMartData as any } }),
  exitBreakPlugin,
  resetBlockTypePlugin,
  ...deletePlugins,
  softBreakPlugin,
  TrailingBlockPlugin,

  // Deserialization
  DocxPlugin,
  MarkdownPlugin.configure({ options: { indentList: true } }),
  JuicePlugin,

  // UI
  StandardFixedToolbarPlugin,
  StandardFloatingToolbarPlugin,
]

export const minimalPlugins = [
  // AI
  //...aiPlugins,

  // Nodes
  ...basicNodesPlugins,
  HorizontalRulePlugin,
  linkPlugin,

  // Marks
  FontColorPlugin,
  FontBackgroundColorPlugin,
  FontSizePlugin,
  HighlightPlugin,

  // Block Style
  alignPlugin,
  ...indentListPlugins,
  lineHeightPlugin,

  // Functionality
  SlashPlugin.extend({
    options: {
      triggerQuery(editor) {
        return !editor.api.some({
          match: { type: editor.getType(CodeBlockPlugin) },
        })
      },
    },
  }),
  autoformatPlugin,
  cursorOverlayPlugin,
  ...blockMenuPlugins,
  //...dndPlugins,
  EmojiPlugin.configure({ options: { data: emojiMartData as any } }),
  exitBreakPlugin,
  resetBlockTypePlugin,
  ...deletePlugins,
  softBreakPlugin,
  TrailingBlockPlugin,

  // UI
  MinimalFixedToolbarPlugin,
  MinimalFloatingToolbarPlugin,
]
