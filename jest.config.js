const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Three.js ESM → use hand-written mock (jsdom has no WebGL)
    '^three$': '<rootDir>/__mocks__/three.ts',
    // GSAP: use identity mock so ScrollTrigger calls are no-ops in tests
    '^gsap$': '<rootDir>/__mocks__/gsap.ts',
    '^gsap/(.*)$': '<rootDir>/__mocks__/gsap.ts',
    '^@gsap/react$': '<rootDir>/__mocks__/@gsap/react.ts',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/\\.claude/', '<rootDir>/\\.claire/'],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'scripts/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!scripts/__tests__/**',
    // Boilerplate layout and standalone CLI scripts (no testable logic)
    '!app/layout.tsx',
    '!scripts/generate-assets.ts',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
