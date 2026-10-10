export const getForwardedFor = (req: Request): string | undefined => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined

export const getClientIp = (req: Request): string => req.headers.get('cf-connecting-ip') || getForwardedFor(req) || 'unknown'
