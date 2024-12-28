import { bedrock } from "@ai-sdk/amazon-bedrock";
import { createEdgeRuntimeAPI } from "@assistant-ui/react/edge";
import { bedrockModelArn } from '@repo/dally/chat'

const modelID = bedrockModelArn || "";

export const { POST } = createEdgeRuntimeAPI({
    model: bedrock(modelID),
});