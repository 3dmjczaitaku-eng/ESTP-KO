// Jest mock for GSAP
// ScrollTrigger and timeline animations are no-ops in jsdom.

const gsap = {
  to: jest.fn(),
  from: jest.fn(),
  fromTo: jest.fn(),
  set: jest.fn(),
  timeline: jest.fn(() => ({
    to: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    fromTo: jest.fn().mockReturnThis(),
    play: jest.fn().mockReturnThis(),
    pause: jest.fn().mockReturnThis(),
    kill: jest.fn(),
  })),
  registerPlugin: jest.fn(),
  ticker: {
    add: jest.fn(),
    remove: jest.fn(),
  },
  context: jest.fn((fn: () => void) => {
    fn()
    return { revert: jest.fn() }
  }),
}

export const ScrollTrigger = {
  create: jest.fn(),
  refresh: jest.fn(),
  kill: jest.fn(),
  getAll: jest.fn(() => []),
}

export default gsap
