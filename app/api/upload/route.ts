import { NextRequest, NextResponse } from 'next/server'
import { uploadMedia } from '@/lib/cloudinary'

const ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png', 'video/webm', 'video/mp4'] as const

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'ファイルが必要です' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
    return NextResponse.json(
      { error: `対応していないファイル形式です。対応形式: ${ALLOWED_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const resourceType = file.type.startsWith('video/') ? 'video' : 'image'

  const result = await uploadMedia(buffer, { resource_type: resourceType })
  return NextResponse.json(result)
}
