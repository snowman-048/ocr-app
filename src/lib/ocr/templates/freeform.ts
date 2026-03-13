import z from 'zod'

import { TOcrTemplate } from '.'
import { createOcrCellSchema, createOcrRecordSchema } from '../schemas'
import { defaultExportVariant } from './lib/export-variants'

const freeformRecordSchema = createOcrRecordSchema([
  createOcrCellSchema({
    key: z.string().min(1),
    value: z.union([z.string(), z.number(), z.null()]),
  }),
])

const FREEFORM_TEMPLATE_TYPE = 'freeform'

const freeformTemplate: TOcrTemplate = {
  type: FREEFORM_TEMPLATE_TYPE,
  name: 'Auto-Detect Fields',
  description: 'Automatically detect and extract all fields without predefined structure',
  schema: freeformRecordSchema,
  exportVariants: [defaultExportVariant],
}

export { freeformTemplate, freeformRecordSchema, FREEFORM_TEMPLATE_TYPE }
