import { createUIMessageStream, createUIMessageStreamResponse, generateText, Output, streamText, StreamTextTransform, tool, ToolSet } from 'ai'
import { google } from '@ai-sdk/google'

import { NextResponse, type NextRequest } from 'next/server'

import { createSlateEditor, nanoid, type SlateEditor } from 'platejs'
import { BaseEditorKit } from '@repo/ui/components/editor/editor-base-kit.tsx'
import type { ChatMessage, ToolName } from '@repo/ui/components/editor/use-chat.ts'
import { markdownJoinerTransform } from '@repo/ui/lib/markdown-joiner-transform'
import { z } from 'zod'

import { getChooseToolPrompt, getCommentPrompt, getEditPrompt, getGeneratePrompt } from './prompts'
import { auth } from '@/lib/auth/auth'

const DEFAULT_MODEL = 'gemini-2.5-flash'

// api/ai/command is used for AI-powered commands within the editor, such as commenting, editing, and generating content.
// this is different than the ai/suggestions endpoint, which is used for generating suggestions based on context outside of the editor and is from the fine-tuned model.
export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session || !session.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { apiKey, ctx, messages: messagesRaw = [], model } = await req.json()

  const { children, selection, toolName: toolNameParam } = ctx

  const editor = createSlateEditor({
    plugins: BaseEditorKit,
    selection,
    value: children,
  })

  const GOOGLE_GENERATIVE_AI_API_KEY = apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY

  if (!GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json({ error: 'Missing GOOGLE_GENERATIVE_AI_API_KEY.' }, { status: 401 })
  }

  const buildModel = (name: string) => google(name)

  const selectedModel = buildModel(model || DEFAULT_MODEL)
  const isSelecting = editor.api.isExpanded()

  try {
    const stream = createUIMessageStream<ChatMessage>({
      execute: async ({ writer }) => {
        let toolName = toolNameParam

        if (!toolName) {
          const { text: AIToolName } = await generateText({
            model: selectedModel,
            output: Output.choice({
              options: isSelecting ? ['generate', 'edit', 'comment'] : ['generate', 'comment'],
            }),
            prompt: getChooseToolPrompt(messagesRaw),
          })

          writer.write({
            data: AIToolName as ToolName,
            type: 'data-toolName',
          })

          toolName = AIToolName
        }

        const stream = streamText({
          experimental_transform: markdownJoinerTransform() as StreamTextTransform<ToolSet>,
          model: selectedModel,
          prompt: '',
          tools: {
            comment: getCommentTool(editor, {
              messagesRaw,
              model: selectedModel,
              writer,
            }),
          },

          prepareStep: async (step) => {
            if (toolName === 'comment') {
              return {
                ...step,
                toolChoice: { toolName: 'comment', type: 'tool' },
              }
            }

            if (toolName === 'edit') {
              const editPrompt = getEditPrompt(editor, {
                isSelecting,
                messages: messagesRaw,
              })

              return {
                ...step,
                activeTools: [],
                messages: [{ role: 'user', content: editPrompt }],
                model: selectedModel,
              }
            }

            if (toolName === 'generate') {
              const generatePrompt = getGeneratePrompt(editor, {
                messages: messagesRaw,
              })

              return {
                ...step,
                activeTools: [],
                messages: [{ role: 'user', content: generatePrompt }],
                model: selectedModel,
              }
            }
          },
        })

        writer.merge(stream.toUIMessageStream({ sendFinish: false }))
      },
    })

    return createUIMessageStreamResponse({ stream })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 })
  }
}

const getCommentTool = (
  editor: SlateEditor,
  {
    messagesRaw,
    model,
    writer,
  }: {
    messagesRaw: ChatMessage[]
    model: ReturnType<typeof google>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    writer: any
  },
) =>
  tool({
    description: 'Comment on the content',
    inputSchema: z.object({}),
    execute: async () => {
      const { elementStream } = streamText({
        model,
        output: Output.array({
          element: z
            .object({
              blockId: z.string().describe('The id of the starting block. If the comment spans multiple blocks, use the id of the first block.'),
              comment: z.string().describe('A brief comment or explanation.'),
              content: z.string().describe(`The original document fragment. If spanning blocks, separate by two \\n\\n.`),
            })
            .describe('A single comment'),
        }),

        prompt: getCommentPrompt(editor, {
          messages: messagesRaw,
        }),
      })

      for await (const comment of elementStream) {
        writer.write({
          id: nanoid(),
          data: { comment, status: 'streaming' },
          type: 'data-comment',
        })
      }

      writer.write({
        id: nanoid(),
        data: { comment: null, status: 'finished' },
        type: 'data-comment',
      })
    },
  })
