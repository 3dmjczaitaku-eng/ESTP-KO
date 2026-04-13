import templateJson from './wan21-workflow-template.json'

export interface Wan21WorkflowParams {
  imageFilename: string
  positivePrompt: string
  negativePrompt: string
  outputPrefix: string
  numFrames?: number
  fps?: number
}

type WorkflowNode = {
  class_type: string
  inputs: Record<string, unknown>
}

type WorkflowJson = Record<string, WorkflowNode>

export function buildWan21Workflow(params: Wan21WorkflowParams): Record<string, unknown> {
  // Deep clone to prevent mutation across calls
  const wf = JSON.parse(JSON.stringify(templateJson)) as WorkflowJson

  const setInput = (nodeId: string, key: string, value: unknown) => {
    if (wf[nodeId]?.inputs !== undefined) {
      wf[nodeId].inputs[key] = value
    }
  }

  setInput('1', 'image', params.imageFilename)
  setInput('5', 'text', params.positivePrompt)
  setInput('6', 'text', params.negativePrompt)
  setInput('9', 'filename_prefix', params.outputPrefix)
  setInput('3', 'num_frames', params.numFrames ?? 81)
  setInput('3', 'fps', params.fps ?? 24)

  return wf
}
