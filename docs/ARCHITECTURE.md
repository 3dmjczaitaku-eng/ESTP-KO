# Architecture Documentation

## Project Overview

Claude Code Adoption Demo: Production-grade iPhone 17 Pro product site built with Next.js 15.

**Goal**: Showcase Claude Code capabilities + repeatable architecture for product pages.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16.2.3 (App Router)
- **UI Library**: React 19.2.4
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion 12.38.0

### Testing
- **Unit Tests**: Jest 30.3.0
- **Component Tests**: React Testing Library 16.3.2
- **Coverage Target**: 80%+

### Build & Deploy
- **Build Tool**: Turbopack (Next.js 16)
- **Package Manager**: npm
- **Dev Server**: Next.js dev (localhost:3000)

---

## Project Structure

```
claude-code-adoption-demo/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Root landing page
│   ├── layout.tsx                # Root layout wrapper
│   ├── globals.css               # Tailwind + custom CSS
│   └── __tests__/                # Integration tests
├── components/                   # React components
│   ├── Navigation.tsx            # Header + nav links
│   ├── Hero.tsx                  # Hero section
│   ├── ProductGallery.tsx        # Image carousel
│   └── TechSpecs.tsx             # Specs grid
├── lib/                          # Utilities & hooks
│   ├── assetConfig.ts           # Asset loading + caching
│   ├── hooks.ts                 # Custom React hooks
│   ├── replicate.ts             # Replicate API client
│   └── __tests__/               # Unit tests
├── public/                       # Static assets
│   ├── images/                  # Product images (AI-generated)
│   ├── videos/                  # Background videos
│   └── assets.json              # Asset manifest
├── scripts/                      # Automation scripts
│   └── generate-assets.ts       # Replicate batch generation
├── docs/                         # Documentation
│   ├── ADOPTION_BRIEF.md        # Executive summary
│   ├── ARCHITECTURE.md          # This file
│   ├── ASSET_GENERATION.md      # Image generation guide
│   └── SKILLS_BREAKDOWN.md      # Claude Code features used
├── jest.config.js               # Jest configuration
├── jest.setup.js                # Jest mocks (IntersectionObserver, fetch)
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies & scripts

```

---

## Key Design Patterns

### 1. Asset Configuration System

**Problem**: Components shouldn't hardcode image/video paths.

**Solution**: 
- `public/assets.json` — JSON manifest of all assets
- `lib/assetConfig.ts` — Runtime loader with caching
- Components fetch via `getAsset()` on mount

**Benefits**:
- Non-technical users can swap images without code
- Fallback to placeholder colors if images missing
- Easy A/B testing (swap assets.json variants)

```typescript
// Component
const heroImage = await getAsset('hero_video.fallback')

// assets.json
{
  "hero_video": {
    "src": "/videos/hero.mp4",
    "fallback": "/images/hero-fallback.jpg",
    "alt": "Hero video"
  }
}
```

### 2. Custom Scroll Hooks

**Problem**: Scroll animations should be efficient (no layout thrashing).

**Solution**:
- `useIntersectionObserver()` — Triggers when element enters viewport
- `useScrollEffect()` — Returns normalized scroll progress (0–1)
- Both use `requestAnimationFrame` + passive listeners

**Benefits**:
- ~60 fps performance on mobile
- No layout recalculations
- Decoupled from component logic

### 3. Framer Motion Variants

**Problem**: Animations should be reusable + consistent timing.

**Solution**: Define variants object, pass to motion components
```typescript
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, type: 'spring' },
  },
}

<motion.div variants={itemVariants} animate={isVisible ? 'visible' : 'hidden'} />
```

---

## Component Architecture

### Navigation
- **Type**: Layout component (sticky header)
- **Features**: 
  - Scroll-triggered border fade
  - Responsive link menu
  - CTA button
- **Dependencies**: Custom `useScrollEffect` hook

### Hero
- **Type**: Page section
- **Features**:
  - Animated gradient text (staggered)
  - Background image
  - Scroll indicator animation
- **Dependencies**: Framer Motion, `useIntersectionObserver`

### ProductGallery
- **Type**: Interactive carousel
- **Features**:
  - Image switching with fade transition
  - Navigation arrows + dots
  - Dynamic title display
- **Dependencies**: Framer Motion AnimatePresence, `useState`

### TechSpecs
- **Type**: Content grid
- **Features**:
  - Staggered card animations
  - Highlight section
  - Responsive grid (1→2→3 columns)
- **Dependencies**: `useStaggerAnimation` hook, Framer Motion

---

## Performance Optimization

### Core Web Vitals Targets
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Optimizations Implemented
1. **Image Lazy Loading**: `Image` component with `priority` flag on hero
2. **Code Splitting**: Next.js automatic per-route splitting
3. **Scroll Event Debouncing**: Passive listeners in hooks
4. **Asset Caching**: `getAsset()` caches manifest
5. **CSS Optimization**: Tailwind purges unused styles

### Measurement
```bash
# Run Lighthouse audit
npx lighthouse http://localhost:3000 --chrome-flags="--headless"
```

---

## Testing Strategy

### Coverage Targets
- **Unit Tests**: Utilities, hooks, helpers (>90%)
- **Component Tests**: UI rendering, prop handling (>80%)
- **Integration Tests**: Full page flow (>70%)
- **Overall**: 80%+ coverage minimum

### Test Categories
1. **lib/assetConfig.test.ts** — Asset loading, caching
2. **lib/hooks.test.ts** — Hook behavior, callbacks
3. **app/__tests__/Navigation.test.tsx** — Header rendering
4. **app/__tests__/Hero.test.tsx** — Hero section
5. **app/__tests__/ProductGallery.test.tsx** — Gallery rendering
6. **app/__tests__/TechSpecs.test.tsx** — Specs grid
7. **app/__tests__/page.test.tsx** — Full page integration

### Running Tests
```bash
# Watch mode (development)
npm run test

# CI mode with coverage report
npm run test:ci
```

---

## Deployment

### Local Development
```bash
npm run dev
# http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

### Recommended Platforms
- **Vercel** (Next.js native, $0–20/month)
- **Railway** (self-hosted feel, $5–50/month)
- **AWS Amplify** (enterprise, variable pricing)

---

## Future Enhancements

1. **Dark Mode**: Tailwind dark: prefix support
2. **Internationalization**: Next.js i18n routing
3. **Analytics**: Vercel Analytics or PostHog
4. **CMS Integration**: Headless CMS (Strapi, Sanity)
5. **Video Optimization**: HLS streaming for hero video
6. **PWA Support**: Service workers + offline caching

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| TypeScript errors | `npm run build` or `npx tsc --noEmit` |
| Styles not applying | Check `globals.css` Tailwind directives |
| Images 404 | Verify `public/images/` files exist |
| Tests failing | Run `npm run test -- --no-cache` |
| Animations janky | Check `useScrollEffect` frequency, reduce motion queries |

---

## Contributing

1. Follow TypeScript strict mode
2. Write tests for new features (TDD: red → green → refactor)
3. Maintain 80%+ coverage
4. Use conventional commits: `feat:`, `fix:`, `refactor:`, etc.
5. Run `npm run build` before committing

