import { buildWan21Workflow } from '../wan21-workflow'

describe('buildWan21Workflow', () => {
  const params = {
    imageFilename: 'facility.jpg',
    positivePrompt: 'a creative studio',
    negativePrompt: 'blur, artifacts',
    outputPrefix: 'facility-studio',
    numFrames: 81,
    fps: 24,
  }

  it('returns an object (workflow JSON)', () => {
    const wf = buildWan21Workflow(params)
    expect(typeof wf).toBe('object')
    expect(wf).not.toBeNull()
  })

  it('injects image filename into LoadImage node', () => {
    const wf = buildWan21Workflow(params) as Record<string, { inputs: Record<string, unknown> }>
    expect(wf['1'].inputs['image']).toBe('facility.jpg')
  })

  it('injects positive prompt into CLIPTextEncode node 5', () => {
    const wf = buildWan21Workflow(params) as Record<string, { inputs: Record<string, unknown> }>
    expect(wf['5'].inputs['text']).toBe('a creative studio')
  })

  it('injects negative prompt into CLIPTextEncode node 6', () => {
    const wf = buildWan21Workflow(params) as Record<string, { inputs: Record<string, unknown> }>
    expect(wf['6'].inputs['text']).toBe('blur, artifacts')
  })

  it('injects output prefix into VHS_VideoCombine node 9', () => {
    const wf = buildWan21Workflow(params) as Record<string, { inputs: Record<string, unknown> }>
    expect(wf['9'].inputs['filename_prefix']).toBe('facility-studio')
  })

  it('injects numFrames into WanImageToVideo node 3', () => {
    const wf = buildWan21Workflow(params) as Record<string, { inputs: Record<string, unknown> }>
    expect(wf['3'].inputs['num_frames']).toBe(81)
  })

  it('injects fps into WanImageToVideo node 3', () => {
    const wf = buildWan21Workflow(params) as Record<string, { inputs: Record<string, unknown> }>
    expect(wf['3'].inputs['fps']).toBe(24)
  })

  it('does not mutate the template on repeated calls', () => {
    buildWan21Workflow(params)
    const wf2 = buildWan21Workflow({ ...params, positivePrompt: 'second call' }) as Record<string, { inputs: Record<string, unknown> }>
    expect(wf2['5'].inputs['text']).toBe('second call')
  })

  it('contains injected values in serialized JSON', () => {
    const wf = buildWan21Workflow(params)
    const str = JSON.stringify(wf)
    expect(str).toContain('a creative studio')
    expect(str).toContain('facility.jpg')
    expect(str).toContain('facility-studio')
  })

  it('uses default numFrames=81 when not specified', () => {
    const wf = buildWan21Workflow({
      imageFilename: 'x.jpg',
      positivePrompt: 'test',
      negativePrompt: 'bad',
      outputPrefix: 'out',
    }) as Record<string, { inputs: Record<string, unknown> }>
    expect(wf['3'].inputs['num_frames']).toBe(81)
  })

  it('uses default fps=24 when not specified', () => {
    const wf = buildWan21Workflow({
      imageFilename: 'x.jpg',
      positivePrompt: 'test',
      negativePrompt: 'bad',
      outputPrefix: 'out',
    }) as Record<string, { inputs: Record<string, unknown> }>
    expect(wf['3'].inputs['fps']).toBe(24)
  })
})
