import { useForm } from 'react-hook-form'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { TOcrTemplate } from '@/lib/ocr/templates'

import { Button } from './ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

type TProps = {
  template: TOcrTemplate
  defaultValue?: string | null
  onGoBack: () => void
  onGoNext: (formatMethodId: string) => void
}

const FormatMethodStep = ({ template, defaultValue, onGoBack, onGoNext }: TProps) => {
  const t = useTranslations()

  const form = useForm({
    defaultValues: {
      exportVariantId: defaultValue ?? template.exportVariants[0].id,
    },
  })

  const onSubmit = async (data: { exportVariantId: string }) => {
    onGoNext(data.exportVariantId)
  }

  return (
    <Card className="max-w-lg w-full">
      <CardHeader>
        <CardTitle className="gap-1">
          <Button onClick={onGoBack} size="icon-sm" variant="ghost">
            <ArrowLeft />
          </Button>
          {template.name}
        </CardTitle>
        <CardDescription>{template.description}</CardDescription>
        <CardAction>
          <Button
            onClick={() => {
              onGoNext(form.getValues('exportVariantId'))
            }}
          >
            {t('common.next')}
            <ArrowRight />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="exportVariantId"
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>{t('format_method.label')}</FormLabel>
                  <FormControl>
                    <Select {...field} onValueChange={onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {template.exportVariants.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export { FormatMethodStep }
