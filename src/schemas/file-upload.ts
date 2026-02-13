import { useTranslations } from 'next-intl'
import z from 'zod'

import { EOcrMethod } from '@/lib/ocr/enums'
import { TTemplateType } from '@/lib/ocr/templates'

const createUploadFileSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    file: z
      .instanceof(File, { error: t('validation.required') })
      .refine((file) => file.size <= 10 * 1024 * 1024, t('validation.big_file', { size: '10' }))
      .refine(
        (file) => ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type),
        t('validation.file_type', { files: 'JPEG, PNG' }),
      ),
    method: z.enum(Object.values(EOcrMethod)),
    templateType: z.string<TTemplateType>(),
  })

export { createUploadFileSchema }
