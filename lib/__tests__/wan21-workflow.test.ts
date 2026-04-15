/**
 * Wan2.1 Workflow Tests
 *
 * Covers:
 *   - generateWan21Workflow: basic workflow generation
 *   - generateWan21Workflow: custom parameters override defaults
 *   - validateWorkflow: valid workflow passes
 *   - validateWorkflow: missing required nodes fails
 *   - validateWorkflow: missing inputs fails
 *   - getWorkflowConnections: extracts all connections
 */

import {
  generateWan21Workflow,
  validateWorkflow,
  getWorkflowConnections,
  type Wan21WorkflowParams,
} from '@/lib/wan21-workflow'

describe('Wan2.1 Workflow Generator', () => {
  describe('generateWan21Workflow', () => {
    it('generates valid workflow with minimal parameters', () => {
      const params: Wan21WorkflowParams = {
        imageFileName: 'photo.jpg',
        positivePrompt: 'beautiful workspace',
        negativePrompt: 'blur, artifacts',
        seed: 42,
      }

      const workflow = generateWan21Workflow(params)

      // Check all required nodes exist
      expect(workflow['1']).toBeDefined() // Load image
      expect(workflow['2']).toBeDefined() // Positive prompt
      expect(workflow['3']).toBeDefined() // Negative prompt
      expect(workflow['4']).toBeDefined() // Model loader
      expect(workflow['5']).toBeDefined() // Sampler
      expect(workflow['6']).toBeDefined() // Video output

      // Validate output structure
      const validation = validateWorkflow(workflow)
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('applies custom parameters', () => {
      const params: Wan21WorkflowParams = {
        imageFileName: 'custom.jpg',
        imageSubfolder: 'facility',
        positivePrompt: 'custom positive',
        negativePrompt: 'custom negative',
        seed: 999,
        steps: 50,
        guidance: 5.0,
        motionBucketId: 200,
      }

      const workflow = generateWan21Workflow(params)

      expect(workflow['1'].inputs.image).toBe('custom.jpg')
      expect(workflow['1'].inputs.subfolder).toBe('facility')
      expect(workflow['2'].inputs.text).toBe('custom positive')
      expect(workflow['3'].inputs.text).toBe('custom negative')
      expect(workflow['5'].inputs.seed).toBe(999)
      expect(workflow['5'].inputs.steps).toBe(50)
      expect(workflow['5'].inputs.cfg).toBe(5.0)
      expect(workflow['5'].inputs.motion_bucket_id).toBe(200)
    })

    it('uses default values for optional parameters', () => {
      const params: Wan21WorkflowParams = {
        imageFileName: 'photo.jpg',
        positivePrompt: 'test',
        negativePrompt: 'test',
        seed: 1,
      }

      const workflow = generateWan21Workflow(params)

      expect(workflow['1'].inputs.subfolder).toBe('input')
      expect(workflow['5'].inputs.steps).toBe(30)
      expect(workflow['5'].inputs.cfg).toBe(7.5)
      expect(workflow['5'].inputs.motion_bucket_id).toBe(127)
      expect(workflow['5'].inputs.output_frames).toBe(81)
    })

    it('creates proper node connections', () => {
      const params: Wan21WorkflowParams = {
        imageFileName: 'test.jpg',
        positivePrompt: 'test',
        negativePrompt: 'test',
        seed: 42,
      }

      const workflow = generateWan21Workflow(params)

      // Check sampler references correct nodes
      const samplerInputs = workflow['5'].inputs
      expect(samplerInputs.model).toEqual(['4', 0])
      expect(samplerInputs.positive).toEqual(['2', 0])
      expect(samplerInputs.negative).toEqual(['3', 0])
      expect(samplerInputs.image).toEqual(['1', 0])

      // Check video output references sampler
      const videoInputs = workflow['6'].inputs
      expect(videoInputs.images).toEqual(['5', 0])
    })
  })

  describe('validateWorkflow', () => {
    it('validates correct workflow', () => {
      const params: Wan21WorkflowParams = {
        imageFileName: 'photo.jpg',
        positivePrompt: 'test',
        negativePrompt: 'test',
        seed: 1,
      }

      const workflow = generateWan21Workflow(params)
      const validation = validateWorkflow(workflow)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('detects missing required nodes', () => {
      const workflow: Record<string, any> = {
        '1': { inputs: { image: 'test.jpg' }, class_type: 'LoadImage' },
        // Missing nodes 2-6
      }

      const validation = validateWorkflow(workflow as any)

      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
      expect(validation.errors.some((e) => e.includes('Missing required node'))).toBe(true)
    })

    it('detects missing class_type', () => {
      const workflow: Record<string, any> = {
        '1': { inputs: { image: 'test.jpg' } }, // Missing class_type
      }

      const validation = validateWorkflow(workflow as any)

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.includes('class_type'))).toBe(true)
    })

    it('detects missing inputs object', () => {
      const workflow: Record<string, any> = {
        '1': { class_type: 'LoadImage' }, // Missing inputs
      }

      const validation = validateWorkflow(workflow as any)

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.includes('inputs'))).toBe(true)
    })

    it('detects missing prompt text', () => {
      const workflow: Record<string, any> = {
        '1': { inputs: { image: 'test.jpg' }, class_type: 'LoadImage' },
        '2': { inputs: { text: 'positive' }, class_type: 'CLIPTextEncode' },
        '3': { inputs: {}, class_type: 'CLIPTextEncode' }, // Missing text
        '4': { inputs: {}, class_type: 'WanVideoLoader' },
        '5': { inputs: {}, class_type: 'WanVideoSampler' },
        '6': { inputs: {}, class_type: 'VHS_VideoCombine' },
      }

      const validation = validateWorkflow(workflow as any)

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.includes('Negative prompt'))).toBe(true)
    })
  })

  describe('getWorkflowConnections', () => {
    it('extracts all node connections', () => {
      const params: Wan21WorkflowParams = {
        imageFileName: 'photo.jpg',
        positivePrompt: 'test',
        negativePrompt: 'test',
        seed: 1,
      }

      const workflow = generateWan21Workflow(params)
      const connections = getWorkflowConnections(workflow)

      expect(connections.length).toBeGreaterThan(0)
      expect(connections.some((c) => c.includes('Node 5') && c.includes('Node 4'))).toBe(true)
      expect(connections.some((c) => c.includes('Node 5') && c.includes('Node 2'))).toBe(true)
      expect(connections.some((c) => c.includes('Node 5') && c.includes('Node 3'))).toBe(true)
      expect(connections.some((c) => c.includes('Node 5') && c.includes('Node 1'))).toBe(true)
    })

    it('returns empty for nodes without array inputs', () => {
      const workflow: Record<string, any> = {
        '1': {
          inputs: { image: 'test.jpg', text: 'simple string' },
          class_type: 'LoadImage',
        },
      }

      const connections = getWorkflowConnections(workflow as any)

      // Should only find connections (array inputs), not simple values
      const hasConnections = connections.some((c) => c.includes('Node'))
      expect(hasConnections).toBe(false)
    })
  })
})
