'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { ImageIcon, SendToBack } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import z from 'zod'

import { useUploadImageForOcr } from '@/api/ocr/mutations'
import { TOcrResponse } from '@/api/ocr/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EOcrMethod } from '@/lib/ocr/enums'
import { getAllOcrTemplates } from '@/lib/ocr/templates'
import { cn } from '@/lib/utils'
import { useModal } from '@/providers/modal-provider'
import { createUploadFileSchema } from '@/schemas/file-upload'

import { ImageFilePreview } from './image-file-preview'
import { SortableImageFilesList } from './sortable-image-files-list'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Separator } from './ui/separator'
import { Spinner } from './ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

type TFileStatus = 'queued' | 'processing' | 'done' | 'failed'

type TFileProgress = {
  name: string
  status: TFileStatus
}

const FileProgressIndicator = ({ files }: { files: TFileProgress[] }) => {
  if (!files.length) return null

  return (
    <div className="space-y-1.5">
      {files.map((file, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              'h-2 w-2 rounded-full shrink-0',
              file.status === 'queued' && 'bg-muted-foreground',
              file.status === 'processing' && 'bg-blue-500 animate-pulse',
              file.status === 'done' && 'bg-green-500',
              file.status === 'failed' && 'bg-red-500',
            )}
          />
          <span className="truncate text-muted-foreground">{file.name}</span>
        </div>
      ))}
    </div>
  )
}

type TFormValues = z.infer<ReturnType<typeof createUploadFileSchema>>

type TProps = {
  defaultValues?: TFormValues | null
  onUploadComplete?: (data: TOcrResponse[], values: TFormValues) => void
}

const processingOptions = [
  {
    value: EOcrMethod.OPENAI,
    label: 'OpenAI',
  },
]

const templates = getAllOcrTemplates()

const FileUploadStep = ({ defaultValues, onUploadComplete }: TProps) => {
  const t = useTranslations()

  const [isPending, setIsPending] = useState(false)
  const [fileProgress, setFileProgress] = useState<TFileProgress[]>([])

  const { openModal, closeModal } = useModal()
  const { mutateAsync: uploadImageForOcr } = useUploadImageForOcr()

  const form = useForm({
    resolver: zodResolver(createUploadFileSchema(t)),
    defaultValues: defaultValues || {
      files: undefined,
      method: processingOptions[0].value,
      templateType: 'freeform',
    },
    disabled: isPending,
  })

  const onPreview = (files: File[]) => {
    if (!files?.length) return

    openModal(<ImageFilePreview files={files} />, {
      title: t('image_upload.preview.title'),
      description: t('image_upload.preview.description'),
    })
  }

  const onReorderFiles = (files: File[]) => {
    if (!files?.length) return

    openModal(
      <SortableImageFilesList
        items={files.map((file, index) => ({
          id: `${file.name}-${file.size}-${index}`,
          data: file,
        }))}
        onSave={(reorderedFiles) => {
          form.setValue(
            'files',
            reorderedFiles.map(({ data }) => data),
          )
          closeModal()
          toast.success(t('toast.success.files_reordered'))
        }}
        onClose={closeModal}
      />,
      {
        title: t('image_upload.reorder.title'),
        description: t('image_upload.reorder.description'),
      },
    )
  }

  const onChangeFiles = (fileList: FileList | File[] | null) => {
    const files = fileList ? Array.from(fileList) : undefined
    if (files) form.setValue('files', files)
  }

  const onSubmit = async (data: TFormValues) => {
    setIsPending(true)

    const initialProgress: TFileProgress[] = data.files.map((file) => ({
      name: file.name,
      status: 'queued',
    }))
    setFileProgress(initialProgress)

    const updateFileStatus = (index: number, status: TFileStatus) => {
      setFileProgress((prev) => prev.map((f, i) => (i === index ? { ...f, status } : f)))
    }

    try {
      // Process files with concurrency limit of 5
      const MAX_CONCURRENT = 5
      const results: PromiseSettledResult<Awaited<ReturnType<typeof uploadImageForOcr>>>[] = []
      const queue = [...data.files.map((file, index) => ({ file, index }))]

      const processFile = async (file: File, index: number) => {
        updateFileStatus(index, 'processing')
        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('method', data.method)
          formData.append('templateType', data.templateType)

          const result = await uploadImageForOcr(formData)
          updateFileStatus(index, 'done')
          results[index] = { status: 'fulfilled', value: result }
        } catch (error) {
          updateFileStatus(index, 'failed')
          results[index] = { status: 'rejected', reason: error }
        }
      }

      // Process in batches of MAX_CONCURRENT
      while (queue.length > 0) {
        const batch = queue.splice(0, MAX_CONCURRENT)
        await Promise.all(batch.map(({ file, index }) => processFile(file, index)))
      }

      const succeeded = results
        .filter(
          (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof uploadImageForOcr>>> =>
            r.status === 'fulfilled',
        )
        .map((r) => r.value)

      const failedCount = results.filter((r) => r.status === 'rejected').length

      if (failedCount > 0) {
        toast.error(
          t('toast.error.partial_upload_failure', {
            failed: failedCount,
            total: data.files.length,
          }),
        )
      }

      if (!succeeded.length) {
        toast.error(t('toast.error.all_uploads_failed'))
        return
      }

      const longestTime = succeeded.reduce((acc, item) => {
        return acc.data.processingTime > item.data.processingTime ? acc : item
      }).data.processingTime

      toast.success(
        t('toast.success.visual_detection', {
          time: longestTime / 1000,
        }),
      )

      onUploadComplete?.(
        succeeded.map((r) => r.data),
        { ...data, files: data.files.filter((_, i) => results[i].status === 'fulfilled') },
      )
    } catch (error) {
      console.error(error)
    } finally {
      setIsPending(false)
      setFileProgress([])
    }
  }

  return (
    <Card className="max-w-lg w-full">
      <CardHeader>
        <CardTitle>{t('image_upload.title')}</CardTitle>
        <CardDescription>{t('image_upload.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="files"
              render={({ field: { onChange: _, value, disabled, ...field } }) => (
                <FormItem>
                  <FormLabel>{t('image_upload.form.select_image.label')}</FormLabel>
                  <FormControl>
                    <div className="w-full flex items-center gap-2">
                      <Input
                        id="file"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        multiple
                        disabled={disabled}
                        data-value={
                          value?.length
                            ? t('image_upload.form.select_image.selected_files', {
                                amount: value.length,
                              })
                            : t('image_upload.form.select_image.no_files')
                        }
                        className={`placeholder:text-transparent! text-transparent! relative after:content-[attr(data-value)] after:block after:text-muted-foreground after:absolute after:right-2 after:top-[50%] after:translate-y-[-50%] after:max-w-[50%] after:truncate md:after:max-w-[70%]`}
                        onChange={(e) => onChangeFiles(e.target.files)}
                        {...field}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button
                              size="icon"
                              type="button"
                              aria-label={t('image_upload.reorder.title')}
                              disabled={!value?.length || value.length < 2 || isPending}
                              onClick={() => onReorderFiles(value)}
                            >
                              <SendToBack />
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{t('image_upload.reorder.title')}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button
                              size="icon"
                              type="button"
                              aria-label={t('image_upload.preview.title')}
                              disabled={!value?.length}
                              onClick={() => onPreview(value)}
                            >
                              <ImageIcon />
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{t('image_upload.preview.title')}</TooltipContent>
                      </Tooltip>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="method"
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>{t('image_upload.form.processing_method.label')}</FormLabel>
                  <FormControl>
                    <Select {...field} onValueChange={onChange} disabled>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {processingOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="templateType"
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>{t('image_upload.form.template_type.label')}</FormLabel>
                  <FormControl>
                    <Select {...field} onValueChange={onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.type} value={template.type}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {isPending && fileProgress.length > 0 && <FileProgressIndicator files={fileProgress} />}

            <Button type="submit" className="w-full" disabled={form.formState.disabled}>
              {isPending && <Spinner />}
              {t('image_upload.form.submit')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export { FileUploadStep }

export type { TFormValues as TFileUploadFormValues }
