declare global {
  const grecaptcha: {
    execute(siteKey: string, options: { action: string }): Promise<string>
  }
}

export {}
