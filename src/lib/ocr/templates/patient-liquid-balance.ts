// import z from 'zod'
import { TOcrTemplate } from '.'
import { EOcrMethod } from '../enums'

// import { createOcrCellSchema, createOcrRecordSchema } from '../schemas'

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

const NUMBER_OF_ROWS = 24

const patientLiquidBalanceTemplate: TOcrTemplate = {
  type: 'patientLiquidBalance' as const,
  name: 'Patient Liquid Balance',
  description: `Structured log of a patient's liquid balance for a day`,
  // schema: userActivityRecordSchema,
  expectedRowCount: NUMBER_OF_ROWS,
  ocrMethodMeta: {
    [EOcrMethod.OPENAI]: {
      extractionRules: [
        `This sheet has EXACTLY ${NUMBER_OF_ROWS} rows (hours 7-6 over 24 hours)`,
        'Skip empty columns (columns 5-8)',
        'Ignore total/sum rows at the bottom',
        'If a value spans multiple columns, duplicate it for each relevant field',
        'Header row should NOT be included in extracted data',
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
      description: 'Amount of liquid in ml taken per hour with mouth',
    },
    {
      key: 'injection_intake',
      label: 'Injection Intake',
      type: 'text',
      position: 'Third column',
      description: 'Amount of liquid in ml taken per hour by injecting it into a patient',
    },
    {
      key: 'other_intake',
      label: 'Other Intake',
      type: 'text',
      position: 'Fourth column',
      description: 'Amount of liquid in ml taken per hour by any other means',
    },
    {
      key: 'empty',
      label: 'none',
      type: 'empty',
      position: 'Fifth column',
      description: 'Omit',
    },
    {
      key: 'empty',
      label: 'none',
      type: 'empty',
      position: 'Sixth column',
      description: 'Omit',
    },
    {
      key: 'empty',
      label: 'none',
      type: 'empty',
      position: 'Seventh column',
      description: 'Omit',
    },
    {
      key: 'empty',
      label: 'none',
      type: 'empty',
      position: 'Eighth column',
      description: 'Omit',
    },
    {
      key: 'intake_ngs',
      label: 'Intake NGS',
      type: 'text',
      position: 'Nineth column',
      description: 'Amount of liquid in ml per hour that was taken in by any special means',
    },
    {
      key: 'secretion',
      label: 'Secretion',
      type: 'text',
      position: 'Tenth column',
      description: 'Amount of liquid in ml produced per hour by a patient',
    },
    {
      key: 'special_weight',
      label: 'Special Weight',
      type: 'text',
      position: 'Eleventh column',
      description: 'Amount of liquid in ml produced per hour that was contained',
    },
    {
      key: 'secretion_ngs',
      label: 'Secretion NGS',
      type: 'text',
      position: 'Twelfth column',
      description:
        'Amount of liquid in ml produced per hour that was taken out by any special means',
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
