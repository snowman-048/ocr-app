import z from 'zod'

import { createOcrRecordSchema } from './schemas'

type TOcrRecord = z.infer<ReturnType<typeof createOcrRecordSchema>>

type TOcrAiConsumption = {
  input: number
  output: number
  total: number
  cached: number
}

export type { TOcrRecord, TOcrAiConsumption }
