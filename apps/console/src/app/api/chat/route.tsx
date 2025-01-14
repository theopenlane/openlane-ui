import { bedrock } from '@ai-sdk/amazon-bedrock'
import { createEdgeRuntimeAPI } from '@assistant-ui/react/edge'
import { bedrockModelArn, enableChat } from '@repo/dally/chat'

const modelID = bedrockModelArn || ''

let POST

if (enableChat && process.env.AWS_REGION) {
  POST = createEdgeRuntimeAPI({
    model: bedrock(modelID),
  }).POST
}

export { POST }
