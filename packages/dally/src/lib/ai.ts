// AI configuration
// enable or disable AI features
export const aiEnabled = process.env.NEXT_PUBLIC_AI_SUGGESTIONS_ENABLED === 'true'

// configuration for the vertex ai client, used for fined-tuned model requests
export const googleAPIKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64 || ''
export const googleProjectID = process.env.GOOGLE_AI_PROJECT_ID || ''
export const googleAIRegion = process.env.GOOGLE_AI_REGION || ''
export const aiLogBucket = process.env.GCS_LOG_BUCKET || ''
export const ragCorpusID = process.env.GOOGLE_RAG_CORPUS_ID || ''

// this is used for non-tuned model ai such as from the editor, all chat and generated policies use the fine tuned model
export const geminiModelName = process.env.GOOGLE_AI_MODEL_NAME || 'gemini-2.5-flash'

// toggles to control the output from the AI model
export const aiSystemInstruction = process.env.AI_SYSTEM_INSTRUCTION?.trimEnd() ?? 'You are a helpful assistant that provides concise and accurate answers based on the provided context.'

export const controlSystemInstruction =
  process.env.CONTROL_FRAMEWORK_INSTRUCTION?.trimEnd() ?? 'When referencing controls, always use their ref codes with their framework (e.g., "SOC 2 - CC1.1"). Do not use internal identifiers.'

export const policyPrompt = (policyName: string) => `Generate a formal policy document for "${policyName}" based on the following requirements.\n\n` + (process.env.AI_POLICY_PROMPT?.trimEnd() ?? '')

export const temperature = process.env.TEMPERATURE ? parseFloat(process.env.TEMPERATURE) : 0.1
export const maxOutputTokens = process.env.MAX_OUTPUT_TOKENS ? parseInt(process.env.MAX_OUTPUT_TOKENS) : 1500
