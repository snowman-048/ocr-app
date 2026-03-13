'use client'

import { useImageFilesPreviews } from '@/hooks/use-image-files-previews'

import { Card, CardContent, CardFooter } from './ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './ui/carousel'
import { Spinner } from './ui/spinner'

type TProps = {
  files?: File[]
  previews?: {
    fileName?: string
    preview: string
  }[]
}

const ImageFilePreview = ({ files, previews: providedPreviews }: TProps) => {
  const { previews: calculatedPreviews } = useImageFilesPreviews(
    !providedPreviews ? files : undefined,
  )

  const previews =
    providedPreviews ??
    calculatedPreviews.map((preview, index) => ({
      fileName: files?.[index]?.name,
      preview,
    }))

  if (!previews) return <Spinner className="mx-auto" />

  const isMultipleItems = previews.length > 1 || (files?.length ?? 0) > 1

  return (
    <div className="flex items-center justify-center">
      <Carousel
        style={{
          maxWidth: isMultipleItems ? 'calc(100% - 80px)' : '100%',
        }}
        opts={{ align: 'center' }}
      >
        <CarouselContent>
          {previews.map((preview, index) => {
            return (
              <CarouselItem key={index} className="my-auto">
                <Card>
                  <CardContent>
                    <img
                      src={preview.preview}
                      alt={preview.fileName ? `Preview of uploaded file: ${preview.fileName}` : 'Image preview'}
                      className="max-h-full"
                    />
                  </CardContent>
                  <CardFooter>{preview.fileName}</CardFooter>
                </Card>
              </CarouselItem>
            )
          })}
        </CarouselContent>

        {isMultipleItems && (
          <>
            <CarouselPrevious />
            <CarouselNext />
          </>
        )}
      </Carousel>
    </div>
  )
}

export { ImageFilePreview }
