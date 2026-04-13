// Jest mock for Three.js
// jsdom has no WebGL — this replaces GPU calls with no-ops so component logic can be tested.

const mockRenderer = {
  setSize: jest.fn(),
  setPixelRatio: jest.fn(),
  render: jest.fn(),
  dispose: jest.fn(),
  domElement: document.createElement('canvas'),
}

const mockScene = {
  add: jest.fn(),
  remove: jest.fn(),
  children: [],
}

const mockCamera = {
  position: { set: jest.fn(), z: 5 },
  aspect: 1,
  updateProjectionMatrix: jest.fn(),
}

const mockGeometry = {
  setAttribute: jest.fn(),
  dispose: jest.fn(),
}

const mockMaterial = {
  dispose: jest.fn(),
}

const mockPoints = {
  rotation: { x: 0, y: 0, z: 0 },
}

const mockBufferAttribute = jest.fn()

export const WebGLRenderer = jest.fn(() => mockRenderer)
export const Scene = jest.fn(() => mockScene)
export const PerspectiveCamera = jest.fn(() => mockCamera)
export const BufferGeometry = jest.fn(() => mockGeometry)
export const PointsMaterial = jest.fn(() => mockMaterial)
export const Points = jest.fn(() => mockPoints)
export const BufferAttribute = mockBufferAttribute
export const Color = jest.fn()
export const AdditiveBlending = 2
export const MathUtils = {
  randFloatSpread: (range: number) => (Math.random() - 0.5) * range,
}
