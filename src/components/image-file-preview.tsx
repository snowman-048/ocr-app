'use client'

import { useEffect, useState } from 'react'

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
  files: File[]
}

const ImageFilePreview = ({ files }: TProps) => {
  const [previews, setPreviews] = useState<string[]>([])

  useEffect(() => {
    if (!files?.length) return

    files.forEach((file, index) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviews((prev) => {
          const newPreview = [...prev]
          newPreview[index] = reader.result as string
          return newPreview
        })
      }
      reader.readAsDataURL(file)
    })
  }, [files])

  if (!previews) return <Spinner className="mx-auto" />

  return (
    <div className="flex items-center justify-center">
      <Carousel
        style={{
          maxWidth: 'calc(100% - 80px)',
        }}
        opts={{ align: 'center' }}
      >
        <CarouselContent>
          {previews.map((preview, index) => {
            const file = files?.[index]
            return (
              <CarouselItem key={index} className="my-auto">
                <Card>
                  <CardContent>
                    <img src={preview} alt={file?.name || 'Preview'} className="max-h-full" />
                  </CardContent>
                  <CardFooter>{file?.name}</CardFooter>
                </Card>
              </CarouselItem>
            )
          })}
        </CarouselContent>

        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
}

export { ImageFilePreview }
