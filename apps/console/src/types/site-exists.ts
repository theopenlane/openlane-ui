export type SiteExistsRequest = {
  url: string
}

export type SiteExistsResponse = {
  exists: boolean
  error?: string
}
