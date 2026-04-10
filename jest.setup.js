// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

// Mock WebGL canvas context (Three.js requires it even with __mocks__/three.ts)
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  getExtension: jest.fn(),
  getParameter: jest.fn(),
}))

// Mock fetch for assets.json
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        hero_video: {
          src: '/videos/iphone-hero.mp4',
          fallback: '/images/iphone-hero-fallback.jpg',
          alt: 'iPhone 17 Pro hero animation',
          name: 'Hero Video',
        },
        product_images: [
          {
            src: '/images/iphone-angle-1.jpg',
            alt: 'iPhone 17 Pro - Front angle',
            name: 'Front angle',
          },
          {
            src: '/images/iphone-angle-2.jpg',
            alt: 'iPhone 17 Pro - Side profile',
            name: 'Side profile',
          },
          {
            src: '/images/iphone-angle-3.jpg',
            alt: 'iPhone 17 Pro - Back design',
            name: 'Back design',
          },
        ],
      }),
  })
)
