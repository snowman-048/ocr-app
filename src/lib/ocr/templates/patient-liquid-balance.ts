import z from 'zod'

import { TOcrTemplate } from '.'
import { EOcrMethod } from '../enums'
import { createOcrCellSchema, createOcrRecordSchema } from '../schemas'

// const userActivityRecordSchema = createOcrRecordSchema([
//   createOcrCellSchema({ key: z.literal('index'), value: z.number() }),
//   createOcrCellSchema({
//     key: z.literal('date'),
//     value: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, 'Date must be in dd.mm.yyyy format'),
//   }),
//   createOcrCellSchema({ key: z.literal('username'), value: z.string() }),
//   createOcrCellSchema({ key: z.literal('number1'), value: z.number() }),
//   createOcrCellSchema({ key: z.literal('number2'), value: z.number() }),
// ])

const patientLiquidBalanceTemplate: TOcrTemplate = {
  type: 'patientLiquidBalance' as const,
  name: 'Patient Liquid Balance',
  description: `Structured log of a patient's liquid balance for a day`,
  // schema: userActivityRecordSchema,
  ocrMethodMeta: {
    [EOcrMethod.OPENAI]: {
      extractionRules: [
        'Ignore and omit empty columns',
        'Ignore total balance fields',
        `Ignore fields that don't belong to columns described in the structure`,
        'If a value takes several columns, use this value for both columns',
      ],
    },
  },
  fields: [
    {
      key: 'hour',
      label: 'Hour',
      type: 'text',
      position: 'First column',
      description: 'A number representing an hour of a day',
    },
    {
      key: 'normal_intake',
      label: 'Normal Intake',
      type: 'text',
      position: 'Second column',
      description: 'A number representing amount of liquid in ml taken per hour with mouth',
    },
    {
      key: 'injection_intake',
      label: 'Injection Intake',
      type: 'text',
      position: 'Third column',
      description:
        'A number representing amount of liquid in ml taken per hour by injecting it into a patient',
    },
    {
      key: 'other_intake',
      label: 'Other Intake',
      type: 'text',
      position: 'Fourth column',
      description: 'A number representing amount of liquid in ml taken per hour by any other means',
    },
    {
      key: 'secretion',
      label: 'Secretion',
      type: 'text',
      position: 'Tenth column',
      description: 'A number representing amount of liquid in ml produced per hour by a patient',
    },
    {
      key: 'special_weight',
      label: 'Special Weight',
      type: 'text',
      position: 'Eleventh column',
      description:
        'A number representing amount of liquid in ml produced per hour that was contained',
    },
    {
      key: 'ngs',
      label: 'NGS',
      type: 'text',
      position: 'Twelfth column',
      description:
        'A number representing amount of liquid in ml produced per hour that was taken out by any special means',
    },
  ],
  exportVariants: [
    {
      id: 'full',
      name: 'Complete Log',
      description: 'All fields',
      includeFields: ['all'],
    },
  ],
}

export { patientLiquidBalanceTemplate }
