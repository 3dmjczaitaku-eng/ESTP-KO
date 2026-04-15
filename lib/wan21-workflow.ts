/**
 * Wan2.1 Workflow JSON Generator
 * Generates ComfyUI workflow for Wan2.1-I2V image-to-video conversion
 */

export interface Wan21WorkflowParams {
  imageFileName: string
  imageSubfolder?: string
  positivePrompt: string
  negativePrompt: string
  seed: number
  steps?: number
  guidance?: number
  motionBucketId?: number
}

export interface Wan21WorkflowInput {
  [nodeId: string]: {
    inputs: Record<string, unknown>
    class_type: string
  }
}

/**
 * Generates a Wan2.1-I2V ComfyUI workflow JSON
 *
 * The workflow structure follows ComfyUI conventions:
 * - Node IDs are string keys ("1", "2", etc.)
 * - Each node has inputs and class_type
 * - Connections between nodes use array notation [previous_node_id, output_index]
 */
export function generateWan21Workflow(params: Wan21WorkflowParams): Wan21WorkflowInput {
  const {
    imageFileName,
    imageSubfolder = 'input',
    positivePrompt,
    negativePrompt,
    seed,
    steps = 30,
    guidance = 7.5,
    motionBucketId = 127,
  } = params

  // Node structure for Wan2.1-I2V workflow
  // Reference: ComfyUI-WanVideoWrapper documentation

  const workflow: Wan21WorkflowInput = {
    // Load input image
    '1': {
      inputs: {
        image: imageFileName,
        subfolder: imageSubfolder,
      },
      class_type: 'LoadImage',
    },

    // Text positive prompt
    '2': {
      inputs: {
        text: positivePrompt,
      },
      class_type: 'CLIPTextEncode',
    },

    // Text negative prompt
    '3': {
      inputs: {
        text: negativePrompt,
      },
      class_type: 'CLIPTextEncode',
    },

    // Wan2.1 Model loader
    '4': {
      inputs: {
        model: 'wan2.1-i2v-14b-480p',
      },
      class_type: 'WanVideoLoader',
    },

    // Sampler for I2V generation
    '5': {
      inputs: {
        seed,
        steps,
        cfg: guidance,
        motion_bucket_id: motionBucketId,
        input_frames: 1,
        output_frames: 81, // 81 frames @ 24fps = ~3.4 seconds
        model: ['4', 0], // Reference from node 4 (model output)
        positive: ['2', 0], // Reference from node 2 (positive prompt)
        negative: ['3', 0], // Reference from node 3 (negative prompt)
        image: ['1', 0], // Reference from node 1 (input image)
      },
      class_type: 'WanVideoSampler',
    },

    // Video output node
    '6': {
      inputs: {
        format: 'mp4',
        quality: 95,
        fps: 24,
        filename_prefix: 'output',
        images: ['5', 0], // Reference from node 5 (sampler output)
      },
      class_type: 'VHS_VideoCombine',
    },
  }

  return workflow
}

/**
 * Validates workflow structure
 * Ensures all required nodes and connections exist
 */
export function validateWorkflow(workflow: Wan21WorkflowInput): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check required nodes exist
  const requiredNodes = ['1', '2', '3', '4', '5', '6']
  for (const nodeId of requiredNodes) {
    if (!workflow[nodeId]) {
      errors.push(`Missing required node: ${nodeId}`)
    }
  }

  // Validate node structure
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (!node.class_type) {
      errors.push(`Node ${nodeId} missing class_type`)
    }
    if (!node.inputs || typeof node.inputs !== 'object') {
      errors.push(`Node ${nodeId} missing or invalid inputs`)
    }
  }

  // Validate critical inputs
  if (workflow['2'] && !workflow['2'].inputs.text) {
    errors.push('Positive prompt text is required')
  }
  if (workflow['3'] && !workflow['3'].inputs.text) {
    errors.push('Negative prompt text is required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get workflow node connections (for debugging)
 */
export function getWorkflowConnections(workflow: Wan21WorkflowInput): string[] {
  const connections: string[] = []

  for (const [nodeId, node] of Object.entries(workflow)) {
    for (const [inputKey, inputValue] of Object.entries(node.inputs)) {
      if (Array.isArray(inputValue)) {
        const [sourceNodeId, outputIndex] = inputValue
        connections.push(`Node ${nodeId}.${inputKey} <- Node ${sourceNodeId}[${outputIndex}]`)
      }
    }
  }

  return connections
}
