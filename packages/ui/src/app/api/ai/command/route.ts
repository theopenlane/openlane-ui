import type { NextRequest } from 'next/server'

import { createOpenAI } from '@ai-sdk/openai'
import { convertToModelMessages, smoothStream, streamText } from 'ai'
import { NextResponse } from 'next/server'

const CHUNKING_REGEXPS = {
  line: /\n+/m,
  list: /.{8}/m,
  word: /\S+\s+/m,
}

export async function POST(req: NextRequest) {
  const { apiKey: key, messages, system } = await req.json()

  const apiKey = key || process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OpenAI API key.' }, { status: 401 })
  }

  const openai = createOpenAI({ apiKey })

  let isInCodeBlock = false
  let isInTable = false
  let isInList = false
  let isInLink = false
  try {
    const result = streamText({
      experimental_transform: smoothStream({
        chunking: (buffer: string) => {
          if (/```[^\s]+/.test(buffer)) {
            isInCodeBlock = true
          } else if (isInCodeBlock && buffer.includes('```')) {
            isInCodeBlock = false
          }
          if (buffer.includes('http')) {
            isInLink = true
          } else if (buffer.includes('https')) {
            isInLink = true
          } else if (buffer.includes('\n') && isInLink) {
            isInLink = false
          }
          if (buffer.includes('*') || buffer.includes('-')) {
            isInList = true
          } else if (buffer.includes('\n') && isInList) {
            isInList = false
          }
          if (!isInTable && buffer.includes('|')) {
            isInTable = true
          } else if (isInTable && buffer.includes('\n\n')) {
            isInTable = false
          }

          let match

          if (isInCodeBlock || isInTable || isInLink) {
            match = CHUNKING_REGEXPS.line.exec(buffer)
          } else if (isInList) {
            match = CHUNKING_REGEXPS.list.exec(buffer)
          } else {
            match = CHUNKING_REGEXPS.word.exec(buffer)
          }
          if (!match) {
            return null
          }

          return buffer.slice(0, match.index) + match?.[0]
        },
        delayInMs: 30,
      }),
      maxOutputTokens: 2048,
      messages: await convertToModelMessages(messages),
      model: openai('gpt-4o'),
      system: system,
    })

    return result.toUIMessageStreamResponse()
  } catch {
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 })
  }
}
