import sharp from 'sharp'

import { EImageQuality } from '@/enums/image-quality'

type TProcessImageOptions = {
  grayscale?: boolean
}

const assessImageQuality = async (buffer: Buffer, metadata: sharp.Metadata): Promise<EImageQuality> => {
  const width = metadata.width ?? 0
  const height = metadata.height ?? 0

  if (width < 800 || height < 800) return EImageQuality.POOR

  // Blur detection via Laplacian variance on a small version
  try {
    const { data, info } = await sharp(buffer)
      .grayscale()
      .resize(512, 512, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixels = new Uint8Array(data)
    const w = info.width
    const h = info.height

    let sum = 0
    let sumSq = 0
    let count = 0

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x
        const laplacian =
          4 * pixels[idx] -
          pixels[idx - 1] -
          pixels[idx + 1] -
          pixels[idx - w] -
          pixels[idx + w]
        sum += laplacian
        sumSq += laplacian * laplacian
        count++
      }
    }

    if (count > 0) {
      const mean = sum / count
      const variance = sumSq / count - mean * mean
      if (variance < 100) return EImageQuality.POOR
    }
  } catch {
    // Fall through to GOOD if analysis fails
  }

  return EImageQuality.GOOD
}

const processImage = async (buffer: Buffer, options: TProcessImageOptions = {}) => {
  const { grayscale = true } = options

  const image = sharp(buffer)
  const metadata = await image.metadata()

  const quality = await assessImageQuality(buffer, metadata)

  let pipeline = image
    .rotate()
    .resize(1536, 2048, {
      fit: 'inside',
      withoutEnlargement: true,
      kernel: 'lanczos3',
    })

  if (grayscale) {
    pipeline = pipeline.grayscale()
  }

  pipeline = pipeline.normalize().sharpen({ sigma: 1.0 }).jpeg({ quality: 85, mozjpeg: true })

  const processedBuffer = await pipeline.toBuffer()
  const base64 = processedBuffer.toString('base64')

  return { processedBuffer, quality, base64 }
}

export { processImage }
