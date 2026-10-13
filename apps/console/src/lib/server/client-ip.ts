export const getClientIp = (req: Request): string => req.headers.get('cf-connecting-ip') || 'unknown'
