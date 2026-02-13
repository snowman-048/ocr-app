import sharp from 'sharp'

import { EImageQuality } from '@/enums/image-quality'

const processImage = async (buffer: Buffer) => {
  const metadata = await sharp(buffer).metadata()

  let processedImage = sharp(buffer)
    .resize(2000, 2000, {
      fit: 'inside',
      withoutEnlargement: true,
      kernel: 'lanczos3',
    })
    .grayscale()
    .normalize()
    .sharpen({ sigma: 1.5 })
    .modulate({ brightness: 1.1 })
    .png({ quality: 100 })

  const processedBuffer = await processedImage.toBuffer()
  const base64 = processedBuffer.toString('base64')
  const quality = metadata.width && metadata.width < 800 ? EImageQuality.POOR : EImageQuality.GOOD

  return { processedBuffer, quality, base64 }
}

export { processImage }
