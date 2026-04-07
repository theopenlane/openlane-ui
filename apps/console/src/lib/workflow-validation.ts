type ValidationResult = {
  valid: boolean
  error?: string
}

const isBalancedExpression = (expression: string): ValidationResult => {
  let depth = 0
  let inSingle = false
  let inDouble = false
  let escaped = false

  for (const char of expression) {
    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (char === "'" && !inDouble) {
      inSingle = !inSingle
      continue
    }

    if (char === '"' && !inSingle) {
      inDouble = !inDouble
      continue
    }

    if (inSingle || inDouble) {
      continue
    }

    if (char === '(') {
      depth += 1
    }

    if (char === ')') {
      depth -= 1
      if (depth < 0) {
        return { valid: false, error: 'Unmatched closing parenthesis' }
      }
    }
  }

  if (inSingle || inDouble) {
    return { valid: false, error: 'Unclosed string literal' }
  }

  if (depth !== 0) {
    return { valid: false, error: 'Unmatched opening parenthesis' }
  }

  return { valid: true }
}

export const validateCELExpression = (expression: string): ValidationResult => {
  const trimmed = expression?.trim() ?? ''
  if (!trimmed) {
    return { valid: false, error: 'Expression is empty' }
  }

  return isBalancedExpression(trimmed)
}
