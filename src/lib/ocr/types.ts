import z from 'zod'

import { createOcrRecordSchema } from './schemas'

type TOcrRecord = z.infer<ReturnType<typeof createOcrRecordSchema>>

// type TTemplateMetadata = {
//   type: string
//   name: string
//   description: string
//   icon?: string
// }

// type TExportVariant = {
//   id: string
//   name: string
//   description: string
//   includeFields: string[]
//   transformations?: Record<string, (value: any) => any>
// }

export type { TOcrRecord }
