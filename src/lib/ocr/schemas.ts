import z from 'zod'

import { EConfidenceLevel } from './enums'

const confidenceValues = Object.values(EConfidenceLevel)

const createOcrCellSchema = ({ key, value }: { key: z.ZodType; value: z.ZodType }) =>
  z.object({
    key,
    value,
    confidence: z.enum(confidenceValues),
  })

const createOcrRecordSchema = (data: z.ZodType[]) => z.array(z.union(data))

export { createOcrCellSchema, createOcrRecordSchema }
