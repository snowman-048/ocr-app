import { useTranslations } from 'next-intl'
import z from 'zod'

import { EOcrMethod } from '@/lib/ocr/enums'
import { TTemplateType } from '@/lib/ocr/templates'

const createUploadFileSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    files: z
      .array(z.instanceof(File), { error: t('validation.select_at_least', { amount: '1' }) })
      .min(1, t('validation.select_at_least', { amount: '1' }))
      .max(5, t('validation.select_at_most', { amount: '5' }))
      .refine(
        (files) => files.every((file) => file.size <= 10 * 1024 * 1024),
        t('validation.big_file', { size: '10' }),
      )
      .refine(
        (files) =>
          files.every((file) => ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)),
        t('validation.file_type', { files: 'JPEG, PNG' }),
      ),
    method: z.enum(Object.values(EOcrMethod)),
    templateType: z.string<TTemplateType>(),
  })

export { createUploadFileSchema }
