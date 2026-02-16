import { extractNumbersFromStringAndAdd } from '@/helpers/extract-numbers-from-string'
import { replaceValuesInObject } from '@/helpers/replace-values-in-object'

import { TOcrTemplate } from '.'
import { EOcrMethod } from '../enums'
import { convertTemplateRecords } from './helpers'

const NUMBER_OF_ROWS = 24

type TDetectedDataOutput = {
  hour: string
  normal_intake: string
  injection_intake: string
  other_intake: string
  intake_ngs: string
  secretion: string
  special_weight: string
  secretion_ngs: string
}

type TParsedDataField =
  | 'timeWindow'
  | 'intakePerOs'
  | 'intakeIv'
  | 'intakeIm'
  | 'totalIntake'
  | 'secretionCathether'
  | 'secretionSpecialWeight'
  | 'stool'
  | 'totalSecretion'
  | 'netBalance'

const HEADER_MAP: Record<TParsedDataField, string> = {
  timeWindow: 'Time Window',
  intakePerOs: 'Intake per os',
  intakeIv: 'Intake i.v.',
  intakeIm: 'Intake i.m.',
  totalIntake: 'Total Intake',
  secretionCathether: 'Cathether',
  secretionSpecialWeight: 'Special Weight',
  stool: 'Stool',
  totalSecretion: 'Total Secretion',
  netBalance: 'Net Balance',
}

const patientLiquidBalanceTemplate: TOcrTemplate = {
  type: 'patientLiquidBalance' as const,
  name: 'Patient Liquid Balance',
  description: `Structured log of a patient's liquid balance for a day`,
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
      id: 'default',
      name: 'Default Format',
      description: 'All fields with original formatting',
      formatData: convertTemplateRecords,
    },
    {
      id: 'complete',
      name: 'Complete dataset',
      description: 'Groupped by time windows',
      getHeader: (value) => HEADER_MAP[value as TParsedDataField] ?? value,
      columnsOrder: [
        'timeWindow',
        'intakePerOs',
        'intakeIv',
        'intakeIm',
        'totalIntake',
        'secretionCathether',
        'secretionSpecialWeight',
        'stool',
        'totalSecretion',
        'netBalance',
      ] as TParsedDataField[],
      formatData: (records) => {
        const converted = convertTemplateRecords<TDetectedDataOutput>(records)

        const formattedData = [
          {
            hourFrom: 0,
            hourTo: 6,
          },
          {
            hourFrom: 6,
            hourTo: 12,
          },
          {
            hourFrom: 12,
            hourTo: 18,
          },
          {
            hourFrom: 18,
            hourTo: 24,
          },
        ].map((group) => {
          const rawData = converted.filter(
            (record) => +record.hour >= group.hourFrom && +record.hour < group.hourTo,
          )
          const timeWindow = `${group.hourFrom}:00-${group.hourTo}:00`
          const calculated = rawData.reduce(
            (acc, record) => {
              acc.intakeIv +=
                extractNumbersFromStringAndAdd(record.normal_intake) +
                extractNumbersFromStringAndAdd(record.injection_intake) +
                extractNumbersFromStringAndAdd(record.other_intake)
              acc.secretionCathether += extractNumbersFromStringAndAdd(record.secretion_ngs)
              acc.secretionSpecialWeight +=
                extractNumbersFromStringAndAdd(record.secretion) +
                extractNumbersFromStringAndAdd(record.special_weight)
              return acc
            },
            {
              intakeIv: 0,
              secretionCathether: 0,
              secretionSpecialWeight: 0,
              // Mock
              intakePerOs: 0,
              intakeIm: 0,
              stool: 0,
            },
          )
          const totalIntake = calculated.intakePerOs + calculated.intakeIv + calculated.intakeIm
          const totalSecretion =
            calculated.secretionCathether + calculated.secretionSpecialWeight + calculated.stool
          const netBalance = totalIntake - totalSecretion

          return {
            timeWindow,
            totalIntake,
            totalSecretion,
            netBalance,
            ...replaceValuesInObject({
              object: calculated,
              valueToReplace: 0,
              valueToReplaceWith: '',
            }),
          }
        })

        return formattedData
      },
    },
  ],
}

export { patientLiquidBalanceTemplate }
