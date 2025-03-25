'use client'

import type { Value } from '@udecode/plate'

import { withProps } from '@udecode/cn'
import { AIPlugin } from '@udecode/plate-ai/react'
import { BoldPlugin, CodePlugin, ItalicPlugin, StrikethroughPlugin, SubscriptPlugin, SuperscriptPlugin, UnderlinePlugin } from '@udecode/plate-basic-marks/react'
import { BlockquotePlugin } from '@udecode/plate-block-quote/react'
import { CodeBlockPlugin, CodeLinePlugin, CodeSyntaxPlugin } from '@udecode/plate-code-block/react'
import { CommentsPlugin } from '@udecode/plate-comments/react'
import { DatePlugin } from '@udecode/plate-date/react'
import { EmojiInputPlugin } from '@udecode/plate-emoji/react'
import { ExcalidrawPlugin } from '@udecode/plate-excalidraw/react'
import { HEADING_KEYS } from '@udecode/plate-heading'
import { TocPlugin } from '@udecode/plate-heading/react'
import { HighlightPlugin } from '@udecode/plate-highlight/react'
import { HorizontalRulePlugin } from '@udecode/plate-horizontal-rule/react'
import { KbdPlugin } from '@udecode/plate-kbd/react'
import { ColumnItemPlugin, ColumnPlugin } from '@udecode/plate-layout/react'
import { LinkPlugin } from '@udecode/plate-link/react'
import { EquationPlugin, InlineEquationPlugin } from '@udecode/plate-math/react'
import { AudioPlugin, FilePlugin, ImagePlugin, MediaEmbedPlugin, PlaceholderPlugin, VideoPlugin } from '@udecode/plate-media/react'
import { MentionInputPlugin, MentionPlugin } from '@udecode/plate-mention/react'
import { SlashInputPlugin } from '@udecode/plate-slash-command/react'
import { SuggestionPlugin } from '@udecode/plate-suggestion/react'
import { TableCellHeaderPlugin, TableCellPlugin, TablePlugin, TableRowPlugin } from '@udecode/plate-table/react'
import { TogglePlugin } from '@udecode/plate-toggle/react'
import { type CreatePlateEditorOptions, ParagraphPlugin, PlateLeaf, usePlateEditor } from '@udecode/plate/react'

import { copilotPlugins } from '../editor/plugins/copilot-plugins'
import { advancedPlugins, basicPlugins, standardPlugins } from './plugins/editor-plugins.tsx'
import { AdvancedFixedToolbarPlugin } from './plugins/advanced-fixed-toolbar-plugin.tsx'
import { AdvancedFloatingToolbarPlugin } from './plugins/advanced-floating-toolbar-plugin.tsx'
import { AILeaf } from '../plate-ui/ai-leaf'
import { BlockquoteElement } from '../plate-ui/blockquote-element'
import { CodeBlockElement } from '../plate-ui/code-block-element'
import { CodeLeaf } from '../plate-ui/code-leaf'
import { CodeLineElement } from '../plate-ui/code-line-element'
import { CodeSyntaxLeaf } from '../plate-ui/code-syntax-leaf'
import { ColumnElement } from '../plate-ui/column-element'
import { ColumnGroupElement } from '../plate-ui/column-group-element'
import { CommentLeaf } from '../plate-ui/comment-leaf'
import { DateElement } from '../plate-ui/date-element'
import { EmojiInputElement } from '../plate-ui/emoji-input-element'
import { EquationElement } from '../plate-ui/equation-element'
import { ExcalidrawElement } from '../plate-ui/excalidraw-element'
import { HeadingElement } from '../plate-ui/heading-element'
import { HighlightLeaf } from '../plate-ui/highlight-leaf'
import { HrElement } from '../plate-ui/hr-element'
import { ImageElement } from '../plate-ui/image-element'
import { InlineEquationElement } from '../plate-ui/inline-equation-element'
import { KbdLeaf } from '../plate-ui/kbd-leaf'
import { LinkElement } from '../plate-ui/link-element'
import { MediaAudioElement } from '../plate-ui/media-audio-element'
import { MediaEmbedElement } from '../plate-ui/media-embed-element'
import { MediaFileElement } from '../plate-ui/media-file-element'
import { MediaPlaceholderElement } from '../plate-ui/media-placeholder-element'
import { MediaVideoElement } from '../plate-ui/media-video-element'
import { MentionElement } from '../plate-ui/mention-element'
import { MentionInputElement } from '../plate-ui/mention-input-element'
import { ParagraphElement } from '../plate-ui/paragraph-element'
import { withPlaceholders } from '../plate-ui/placeholder'
import { SlashInputElement } from '../plate-ui/slash-input-element'
import { SuggestionLeaf } from '../plate-ui/suggestion-leaf'
import { TableCellElement, TableCellHeaderElement } from '../plate-ui/table-cell-element'
import { TableElement } from '../plate-ui/table-element'
import { TableRowElement } from '../plate-ui/table-row-element'
import { TocElement } from '../plate-ui/toc-element'
import { ToggleElement } from '../plate-ui/toggle-element'
import { MediaAudioElementStatic } from '../plate-ui/media-audio-element-static'
import { BlockquoteElementStatic } from '../plate-ui/blockquote-element-static'
import { CommentLeafStatic } from '../plate-ui/comment-leaf-static'
import { DateElementStatic } from '../plate-ui/date-element-static'
import { EquationElementStatic } from '../plate-ui/equation-element-static'
import { MediaFileElementStatic } from '../plate-ui/media-file-element-static'
import { HighlightLeafStatic } from '../plate-ui/highlight-leaf-static'
import { HrElementStatic } from '../plate-ui/hr-element-static'
import { ImageElementStatic } from '../plate-ui/image-element-static'
import { InlineEquationElementStatic } from '../plate-ui/inline-equation-element-static'
import { KbdLeafStatic } from '../plate-ui/kbd-leaf-static'
import { LinkElementStatic } from '../plate-ui/link-element-static'
import { MentionElementStatic } from '../plate-ui/mention-element-static'
import { ParagraphElementStatic } from '../plate-ui/paragraph-element-static'
import { SuggestionLeafStatic } from '../plate-ui/suggestion-leaf-static'
import { TableCellElementStatic, TableCellHeaderStaticElement } from '../plate-ui/table-cell-element-static'
import { TableElementStatic } from '../plate-ui/table-element-static'
import { TableRowElementStatic } from '../plate-ui/table-row-element-static'
import { TocElementStatic } from '../plate-ui/toc-element-static'
import { ToggleElementStatic } from '../plate-ui/toggle-element-static'
import { MediaVideoElementStatic } from '../plate-ui/media-video-element-static'
import { CodeBlockElementStatic } from '../plate-ui/code-block-element-static'
import { CodeLeafStatic } from '../plate-ui/code-leaf-static'
import { CodeLineElementStatic } from '../plate-ui/code-line-element-static'
import { CodeSyntaxLeafStatic } from '../plate-ui/code-syntax-leaf-static'
import { ColumnElementStatic } from '../plate-ui/column-element-static'
import { ColumnGroupElementStatic } from '../plate-ui/column-group-element-static'

export const viewComponents = {
  [AudioPlugin.key]: MediaAudioElement,
  [BlockquotePlugin.key]: BlockquoteElement,
  [BoldPlugin.key]: withProps(PlateLeaf, { as: 'strong' }),
  [CodeBlockPlugin.key]: CodeBlockElement,
  [CodeLinePlugin.key]: CodeLineElement,
  [CodePlugin.key]: CodeLeaf,
  [CodeSyntaxPlugin.key]: CodeSyntaxLeaf,
  [ColumnItemPlugin.key]: ColumnElement,
  [ColumnPlugin.key]: ColumnGroupElement,
  [CommentsPlugin.key]: CommentLeaf,
  [DatePlugin.key]: DateElement,
  [EquationPlugin.key]: EquationElement,
  [ExcalidrawPlugin.key]: ExcalidrawElement,
  [FilePlugin.key]: MediaFileElement,
  [HEADING_KEYS.h1]: withProps(HeadingElement, { variant: 'h1' }),
  [HEADING_KEYS.h2]: withProps(HeadingElement, { variant: 'h2' }),
  [HEADING_KEYS.h3]: withProps(HeadingElement, { variant: 'h3' }),
  [HEADING_KEYS.h4]: withProps(HeadingElement, { variant: 'h4' }),
  [HEADING_KEYS.h5]: withProps(HeadingElement, { variant: 'h5' }),
  [HEADING_KEYS.h6]: withProps(HeadingElement, { variant: 'h6' }),
  [HighlightPlugin.key]: HighlightLeaf,
  [HorizontalRulePlugin.key]: HrElement,
  [ImagePlugin.key]: ImageElement,
  [InlineEquationPlugin.key]: InlineEquationElement,
  [ItalicPlugin.key]: withProps(PlateLeaf, { as: 'em' }),
  [KbdPlugin.key]: KbdLeaf,
  [LinkPlugin.key]: LinkElement,
  [MediaEmbedPlugin.key]: MediaEmbedElement,
  [MentionPlugin.key]: MentionElement,
  [ParagraphPlugin.key]: ParagraphElement,
  [PlaceholderPlugin.key]: MediaPlaceholderElement,
  [StrikethroughPlugin.key]: withProps(PlateLeaf, { as: 's' }),
  [SubscriptPlugin.key]: withProps(PlateLeaf, { as: 'sub' }),
  [SuggestionPlugin.key]: SuggestionLeaf,
  [SuperscriptPlugin.key]: withProps(PlateLeaf, { as: 'sup' }),
  [TableCellHeaderPlugin.key]: TableCellHeaderElement,
  [TableCellPlugin.key]: TableCellElement,
  [TablePlugin.key]: TableElement,
  [TableRowPlugin.key]: TableRowElement,
  [TocPlugin.key]: TocElement,
  [TogglePlugin.key]: ToggleElement,
  [UnderlinePlugin.key]: withProps(PlateLeaf, { as: 'u' }),
  [VideoPlugin.key]: MediaVideoElement,
}

export const staticViewComponents = {
  [AudioPlugin.key]: MediaAudioElementStatic,
  [BlockquotePlugin.key]: BlockquoteElementStatic,
  [BoldPlugin.key]: withProps(PlateLeaf, { as: 'strong' }),
  [CodeBlockPlugin.key]: CodeBlockElementStatic,
  [CodeLinePlugin.key]: CodeLineElementStatic,
  [CodePlugin.key]: CodeLeafStatic,
  [CodeSyntaxPlugin.key]: CodeSyntaxLeafStatic,
  [ColumnItemPlugin.key]: ColumnElementStatic,
  [ColumnPlugin.key]: ColumnGroupElementStatic,
  [CommentsPlugin.key]: CommentLeafStatic,
  [DatePlugin.key]: DateElementStatic,
  [EquationPlugin.key]: EquationElementStatic,
  //[ExcalidrawPlugin.key]: ExcalidrawElementStatic,
  [FilePlugin.key]: MediaFileElementStatic,
  [HEADING_KEYS.h1]: withProps(HeadingElement, { variant: 'h1' }),
  [HEADING_KEYS.h2]: withProps(HeadingElement, { variant: 'h2' }),
  [HEADING_KEYS.h3]: withProps(HeadingElement, { variant: 'h3' }),
  [HEADING_KEYS.h4]: withProps(HeadingElement, { variant: 'h4' }),
  [HEADING_KEYS.h5]: withProps(HeadingElement, { variant: 'h5' }),
  [HEADING_KEYS.h6]: withProps(HeadingElement, { variant: 'h6' }),
  [HighlightPlugin.key]: HighlightLeafStatic,
  [HorizontalRulePlugin.key]: HrElementStatic,
  [ImagePlugin.key]: ImageElementStatic,
  [InlineEquationPlugin.key]: InlineEquationElementStatic,
  [ItalicPlugin.key]: withProps(PlateLeaf, { as: 'em' }),
  [KbdPlugin.key]: KbdLeafStatic,
  [LinkPlugin.key]: LinkElementStatic,
  //[MediaEmbedPlugin.key]: MediaEmbedElementStatic,
  [MentionPlugin.key]: MentionElementStatic,
  [ParagraphPlugin.key]: ParagraphElementStatic,
  //[PlaceholderPlugin.key]: MediaPlaceholderElementStatic,
  [StrikethroughPlugin.key]: withProps(PlateLeaf, { as: 's' }),
  [SubscriptPlugin.key]: withProps(PlateLeaf, { as: 'sub' }),
  [SuggestionPlugin.key]: SuggestionLeafStatic,
  [SuperscriptPlugin.key]: withProps(PlateLeaf, { as: 'sup' }),
  [TableCellHeaderPlugin.key]: TableCellHeaderStaticElement,
  [TableCellPlugin.key]: TableCellElementStatic,
  [TablePlugin.key]: TableElementStatic,
  [TableRowPlugin.key]: TableRowElementStatic,
  [TocPlugin.key]: TocElementStatic,
  [TogglePlugin.key]: ToggleElementStatic,
  [UnderlinePlugin.key]: withProps(PlateLeaf, { as: 'u' }),
  [VideoPlugin.key]: MediaVideoElementStatic,
}

const basicComponents = {
  [BlockquotePlugin.key]: BlockquoteElement,
  [BoldPlugin.key]: withProps(PlateLeaf, { as: 'strong' }),
  [CodeBlockPlugin.key]: CodeBlockElement,
  [CodeLinePlugin.key]: CodeLineElement,
  [CodePlugin.key]: CodeLeaf,
  [CodeSyntaxPlugin.key]: CodeSyntaxLeaf,
  [FilePlugin.key]: MediaFileElement,
  [HEADING_KEYS.h1]: withProps(HeadingElement, { variant: 'h1' }),
  [HEADING_KEYS.h2]: withProps(HeadingElement, { variant: 'h2' }),
  [HEADING_KEYS.h3]: withProps(HeadingElement, { variant: 'h3' }),
  [HEADING_KEYS.h4]: withProps(HeadingElement, { variant: 'h4' }),
  [HEADING_KEYS.h5]: withProps(HeadingElement, { variant: 'h5' }),
  [HEADING_KEYS.h6]: withProps(HeadingElement, { variant: 'h6' }),
  [HighlightPlugin.key]: HighlightLeaf,
  [HorizontalRulePlugin.key]: HrElement,
  [ItalicPlugin.key]: withProps(PlateLeaf, { as: 'em' }),
  [KbdPlugin.key]: KbdLeaf,
  [LinkPlugin.key]: LinkElement,
  [MediaEmbedPlugin.key]: MediaEmbedElement,
  [ParagraphPlugin.key]: ParagraphElement,
  [TogglePlugin.key]: ToggleElement,
  [UnderlinePlugin.key]: withProps(PlateLeaf, { as: 'u' }),
}

const standardComponents = {
  [AudioPlugin.key]: MediaAudioElement,
  [BlockquotePlugin.key]: BlockquoteElement,
  [BoldPlugin.key]: withProps(PlateLeaf, { as: 'strong' }),
  [CodeBlockPlugin.key]: CodeBlockElement,
  [CodeLinePlugin.key]: CodeLineElement,
  [CodePlugin.key]: CodeLeaf,
  [CodeSyntaxPlugin.key]: CodeSyntaxLeaf,
  [ColumnItemPlugin.key]: ColumnElement,
  [ColumnPlugin.key]: ColumnGroupElement,
  [CommentsPlugin.key]: CommentLeaf,
  [DatePlugin.key]: DateElement,
  [EquationPlugin.key]: EquationElement,
  [ExcalidrawPlugin.key]: ExcalidrawElement,
  [FilePlugin.key]: MediaFileElement,
  [HEADING_KEYS.h1]: withProps(HeadingElement, { variant: 'h1' }),
  [HEADING_KEYS.h2]: withProps(HeadingElement, { variant: 'h2' }),
  [HEADING_KEYS.h3]: withProps(HeadingElement, { variant: 'h3' }),
  [HEADING_KEYS.h4]: withProps(HeadingElement, { variant: 'h4' }),
  [HEADING_KEYS.h5]: withProps(HeadingElement, { variant: 'h5' }),
  [HEADING_KEYS.h6]: withProps(HeadingElement, { variant: 'h6' }),
  [HighlightPlugin.key]: HighlightLeaf,
  [HorizontalRulePlugin.key]: HrElement,
  [ImagePlugin.key]: ImageElement,
  [InlineEquationPlugin.key]: InlineEquationElement,
  [ItalicPlugin.key]: withProps(PlateLeaf, { as: 'em' }),
  [KbdPlugin.key]: KbdLeaf,
  [LinkPlugin.key]: LinkElement,
  [MediaEmbedPlugin.key]: MediaEmbedElement,
  [MentionPlugin.key]: MentionElement,
  [ParagraphPlugin.key]: ParagraphElement,
  [PlaceholderPlugin.key]: MediaPlaceholderElement,
  [StrikethroughPlugin.key]: withProps(PlateLeaf, { as: 's' }),
  [SubscriptPlugin.key]: withProps(PlateLeaf, { as: 'sub' }),
  [SuggestionPlugin.key]: SuggestionLeaf,
  [SuperscriptPlugin.key]: withProps(PlateLeaf, { as: 'sup' }),
  [TableCellHeaderPlugin.key]: TableCellHeaderElement,
  [TableCellPlugin.key]: TableCellElement,
  [TablePlugin.key]: TableElement,
  [TableRowPlugin.key]: TableRowElement,
  [TocPlugin.key]: TocElement,
  [TogglePlugin.key]: ToggleElement,
  [UnderlinePlugin.key]: withProps(PlateLeaf, { as: 'u' }),
  [VideoPlugin.key]: MediaVideoElement,
  [EmojiInputPlugin.key]: EmojiInputElement,
  [MentionInputPlugin.key]: MentionInputElement,
  [SlashInputPlugin.key]: SlashInputElement,
}

const advancedComponents = {
  [AudioPlugin.key]: MediaAudioElement,
  [BlockquotePlugin.key]: BlockquoteElement,
  [BoldPlugin.key]: withProps(PlateLeaf, { as: 'strong' }),
  [CodeBlockPlugin.key]: CodeBlockElement,
  [CodeLinePlugin.key]: CodeLineElement,
  [CodePlugin.key]: CodeLeaf,
  [CodeSyntaxPlugin.key]: CodeSyntaxLeaf,
  [ColumnItemPlugin.key]: ColumnElement,
  [ColumnPlugin.key]: ColumnGroupElement,
  [CommentsPlugin.key]: CommentLeaf,
  [DatePlugin.key]: DateElement,
  [EquationPlugin.key]: EquationElement,
  [ExcalidrawPlugin.key]: ExcalidrawElement,
  [FilePlugin.key]: MediaFileElement,
  [HEADING_KEYS.h1]: withProps(HeadingElement, { variant: 'h1' }),
  [HEADING_KEYS.h2]: withProps(HeadingElement, { variant: 'h2' }),
  [HEADING_KEYS.h3]: withProps(HeadingElement, { variant: 'h3' }),
  [HEADING_KEYS.h4]: withProps(HeadingElement, { variant: 'h4' }),
  [HEADING_KEYS.h5]: withProps(HeadingElement, { variant: 'h5' }),
  [HEADING_KEYS.h6]: withProps(HeadingElement, { variant: 'h6' }),
  [HighlightPlugin.key]: HighlightLeaf,
  [HorizontalRulePlugin.key]: HrElement,
  [ImagePlugin.key]: ImageElement,
  [InlineEquationPlugin.key]: InlineEquationElement,
  [ItalicPlugin.key]: withProps(PlateLeaf, { as: 'em' }),
  [KbdPlugin.key]: KbdLeaf,
  [LinkPlugin.key]: LinkElement,
  [MediaEmbedPlugin.key]: MediaEmbedElement,
  [MentionPlugin.key]: MentionElement,
  [ParagraphPlugin.key]: ParagraphElement,
  [PlaceholderPlugin.key]: MediaPlaceholderElement,
  [StrikethroughPlugin.key]: withProps(PlateLeaf, { as: 's' }),
  [SubscriptPlugin.key]: withProps(PlateLeaf, { as: 'sub' }),
  [SuggestionPlugin.key]: SuggestionLeaf,
  [SuperscriptPlugin.key]: withProps(PlateLeaf, { as: 'sup' }),
  [TableCellHeaderPlugin.key]: TableCellHeaderElement,
  [TableCellPlugin.key]: TableCellElement,
  [TablePlugin.key]: TableElement,
  [TableRowPlugin.key]: TableRowElement,
  [TocPlugin.key]: TocElement,
  [TogglePlugin.key]: ToggleElement,
  [UnderlinePlugin.key]: withProps(PlateLeaf, { as: 'u' }),
  [VideoPlugin.key]: MediaVideoElement,
  [EmojiInputPlugin.key]: EmojiInputElement,
  [MentionInputPlugin.key]: MentionInputElement,
  [SlashInputPlugin.key]: SlashInputElement,
}

export type TPlateEditorVariants = 'basic' | 'standard' | 'advanced'

export const useCreateEditor = (
  {
    components,
    override,
    readOnly,
    variant = 'standard',
    ...options
  }: {
    components?: Record<string, any>
    plugins?: any[]
    readOnly?: boolean
    variant?: TPlateEditorVariants
  } & Omit<CreatePlateEditorOptions, 'plugins'> = {},
  deps: any[] = [],
) => {
  const componentVariants = {
    basic: withPlaceholders(basicComponents),
    standard: withPlaceholders(standardComponents),
    advanced: withPlaceholders(advancedComponents),
  }

  const pluginVariants = {
    basic: basicPlugins,
    standard: standardPlugins,
    advanced: advancedPlugins,
  }

  return usePlateEditor<Value>(
    {
      override: {
        components: {
          ...(readOnly ? viewComponents : componentVariants[variant]),
          ...components,
        },
        ...override,
      },
      plugins: pluginVariants[variant],
      ...options,
    },
    deps,
  )
}
