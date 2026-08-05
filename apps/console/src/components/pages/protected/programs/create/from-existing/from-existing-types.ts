import { type GetProgramBasicInfoQuery } from '@repo/codegen/src/schema'

export type SourceProgram = GetProgramBasicInfoQuery['program']

export type FrameworkControlCount = {
  framework: string
  count: number
}

export type SourceTeam = {
  admins: string[]
  members: string[]
  auditors: string[]
  editorIDs: string[]
  viewerIDs: string[]
  droppedMemberCount: number
}
