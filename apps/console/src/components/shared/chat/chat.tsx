import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { enableChat } from '@repo/dally/chat'
import { examplePrompts } from './prompts'
import { useChatRuntime, AssistantChatTransport } from '@assistant-ui/react-ai-sdk'
import { AssistantModal } from '@/components/assistant-ui/assistant-modal'

const nextEndpoint: string = '/api/chat'

export default function ChatBot() {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: nextEndpoint,
    }),
  })

  if (enableChat === 'false') {
    return null
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AssistantModal
        welcome={{
          message: 'Here to help, how can I assist you today?',
          suggestions: examplePrompts,
        }}
      />
    </AssistantRuntimeProvider>
  )
}
