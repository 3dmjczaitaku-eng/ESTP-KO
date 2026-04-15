import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

interface UploadOptions {
  folder?: string
  resource_type?: 'image' | 'video' | 'auto'
}

export async function uploadMedia(
  file: Buffer,
  options: UploadOptions = {}
): Promise<{ url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder ?? 'corporate-site',
      resource_type: options.resource_type ?? 'auto',
      ...(options.resource_type === 'image' ? { format: 'webp' } : {}),
    } as const

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error('Upload failed: no result'))
        }
        resolve({ url: result.secure_url, public_id: result.public_id })
      }
    )
    stream.end(file)
  })
}

export { cloudinary }
