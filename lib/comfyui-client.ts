export interface WorkflowPayload {
  prompt: Record<string, unknown>
  client_id: string
}

export interface VideoOutput {
  filename: string
  subfolder: string
  type: string
}

export class ComfyUIClient {
  constructor(private baseUrl: string) {}

  async submitWorkflow(payload: WorkflowPayload): Promise<string> {
    const res = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`ComfyUI submit failed: ${res.status}`)
    const data = await res.json() as { prompt_id: string }
    return data.prompt_id
  }

  async pollUntilDone(promptId: string, intervalMs = 5000): Promise<VideoOutput> {
    for (;;) {
      const res = await fetch(`${this.baseUrl}/history/${promptId}`)
      const history = await res.json() as Record<string, unknown>
      const entry = history[promptId] as {
        status: { completed: boolean }
        outputs: Record<string, { videos?: VideoOutput[] }>
      } | undefined
      if (entry?.status?.completed) {
        const videos = Object.values(entry.outputs).flatMap(o => o.videos ?? [])
        if (videos[0]) return videos[0]
      }
      await new Promise(r => setTimeout(r, intervalMs))
    }
  }

  getDownloadUrl(filename: string, type = 'output'): string {
    return `${this.baseUrl}/view?filename=${encodeURIComponent(filename)}&type=${type}`
  }

  async uploadImage(imageBuffer: Buffer, filename: string): Promise<string> {
    const form = new FormData()
    form.append('image', new Blob([imageBuffer]), filename)
    const res = await fetch(`${this.baseUrl}/upload/image`, { method: 'POST', body: form })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
    const data = await res.json() as { name: string }
    return data.name
  }
}
