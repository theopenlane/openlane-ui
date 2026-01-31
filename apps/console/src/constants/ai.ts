// AI constants for suggestions
export const TEMPERATURE = 0.1
export const MAX_OUTPUT_TOKENS = 5000
export const GEMINI_MODEL_NAME = process.env.GOOGLE_AI_MODEL_NAME || 'gemini-2.5-flash'

export const AI_POLICY_PROMPT = (policyName: string) => `Generate a formal policy document for "${policyName}" based on the following requirements:

The policy should be ALWAYS be structured with clear sections including:
- Purpose and Scope
- Background
- Policy Details

It should use markdown syntax for headings, subheadings, bullet points, and numbered lists where appropriate, always starting with ## for main sections.

The tone should be professional and formal, suitable for an organizational policy document.

Never include the title of the policy in the output.
Never include any preamble or closing statements.
Add placeholder text like [Insert specific details here] where specific organizational details are required to be filled in by the organization.

The scope of the policy should be based on the policy name provided, do not make assumptions beyond that. For example, if the policy name is "Data Retention Policy", the scope should focus on data retention practices only.

If controls are provided in the context, ensure they are referenced as requirements for the policy.

Key requirements to include in the policy:
- Clearly define the purpose and scope of the policy.
- Provide necessary background information.
- Detail the specific policy rules, guidelines, and procedures.
- Include compliance and enforcement measures.
- Outline roles and responsibilities related to the policy.

Make sure to cover all relevant aspects of the policy topic comprehensively without being overly lengthy. If there is an existing template for this type of policy, adapt it to fit our organizational context instead of creating a new one from scratch.`

export const AI_SYSTEM_INSTRUCTION = `
You are a compliance assistant that provides accurate, relevant, and concise guidance.

When providing templates or examples, do not invent details, especially for legal, security, or compliance-related content.

Do not use IDs that look like internal identifiers (e.g., "CTRL-001") in your responses.

Make answers easily understandable, avoiding jargon.

STRICT RULES:
- You CAN interpret spelling mistakes or minor grammatical errors in the user's prompt to understand their intent.
- Use the information in the Retrieved Context below
- You MUST NOT use outside knowledge.
- You MUST NOT reference any control, framework, or identifier not explicitly present in the Retrieved Context if asking about specific frameworks or controls.
- You MUST NOT provide any legal, compliance, or security advice beyond the scope of the Retrieved Context.
- You MUST NOT make up any information or details not contained in the Retrieved Context.
- Use only the information provided in the Information Context (RAG) and Request Context Details.
- Do not invent facts or fill in missing details.
- If the contexts conflict, prefer Request Context Details.
- If neither context contains enough information to answer the question, respond exactly with:
  "I don’t have enough information to answer that."
- If you violate these rules, your answer is incorrect.
`.trim()
