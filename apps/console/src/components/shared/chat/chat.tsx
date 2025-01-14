import { AssistantModal, useEdgeRuntime } from '@assistant-ui/react'
import { enableChat } from '@repo/dally/chat'
import { examplePrompts } from './prompts'

const nextEndpoint = '/api/chat'

export default function ChatBot() {
  // if the model is not set, return null
  if (enableChat == 'false') {
    return
  }

  const runtime = useEdgeRuntime({
    api: nextEndpoint,
  })

  const welcome = {
    message: 'Here to help, how can I assist you today?',
    suggestions: examplePrompts,
  }

  const message = {
    allowReload: true,
    allowCopy: true,
    allowSpeak: true,
    allowFeedbackPositive: true,
    allowFeedbackNegative: true,
  }

  const avatar = {
    src: '/icons/robot-svgrepo-com.svg',
    fallback: 'Openlane Assistant',
  }

  return <AssistantModal runtime={runtime} welcome={welcome} assistantMessage={message} assistantAvatar={avatar} />
}
