import { uploadMedia } from '../cloudinary'

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((options, cb) => {
        // Simulate successful upload
        setTimeout(() => {
          cb(null, {
            secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.webp',
            public_id: 'corporate-site/sample',
          })
        }, 0)
        return { end: jest.fn() }
      }),
    },
  },
}))

describe('uploadMedia', () => {
  it('画像バッファをアップロードしてURLとpublic_idを返す', async () => {
    const result = await uploadMedia(Buffer.from('fake-image-data'))
    expect(result.url).toContain('cloudinary.com')
    expect(result.public_id).toBe('corporate-site/sample')
  })

  it('videoタイプを指定できる', async () => {
    const result = await uploadMedia(Buffer.from('fake-video'), { resource_type: 'video' })
    expect(result.url).toBeDefined()
  })

  it('カスタムフォルダを指定できる', async () => {
    const result = await uploadMedia(Buffer.from('data'), { folder: 'custom-folder' })
    expect(result.url).toBeDefined()
  })
})
