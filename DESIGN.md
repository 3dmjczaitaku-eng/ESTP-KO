# DESIGN.md — 3D&MUSIC JAM Corporate Website
**Project Design Specification** — Machine-readable, numerical-only values.

Color and layout decisions are **hex codes and pixel values only**. No descriptive language.

---

## 1. Color System (Phase 3d Electric Purple Redesign)

### Core Palette

| Role | Hex Code | Usage | Notes |
|------|----------|-------|-------|
| Primary Dark BG | #0A0118 | Main page background | Darkest tone, near-black |
| Surface | #140830 | Card backgrounds, section surfaces | Slightly raised from BG |
| Primary Purple | #7B2FFF | Interactive elements, highlights, links | Main brand accent (vivified from #360E96) |
| Accent Lime | #84FF00 | Secondary accent, borders, highlights | High-energy complementary color |
| Pop Pink | #F472B6 | Emphasis, callouts, pillar highlights | High-saturation pop |
| Pop Yellow | #FBBF24 | Alternative pop, warnings, badges | Warm complementary |
| Pop Green | #34D399 | Success states, positive actions | Teal-green tone |
| Pop Cyan | #22D3EE | Alternative accent, link hover | Cool complementary |

### WCAG Compliance

- **Minimum contrast (4.5:1):** All text colors meet WCAG AA
- **Dark theme:** Primary text on dark backgrounds requires light text (`text-white`, `text-gray-200`)
- **Accent text:** Purple and lime on dark background = 4.5:1+ verified

---

## 2. Typography Rules

### Font Stack (System Fonts)

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif;
```

### Type Scale

| Role | Size | Weight | Line Height | Letter Spacing |
|------|------|--------|-------------|-----------------|
| Display/Hero | 64px | 700 | 1.1 | -2px |
| Heading 1 | 48px | 700 | 1.15 | -1px |
| Heading 2 | 36px | 700 | 1.2 | -0.5px |
| Heading 3 | 28px | 600 | 1.25 | -0.3px |
| Body Large | 18px | 400 | 1.6 | 0px |
| Body | 16px | 400 | 1.6 | 0px |
| Body Small | 14px | 400 | 1.5 | 0.1px |
| Caption | 12px | 500 | 1.4 | 0.2px |

### Readability Constraints

- **Line length:** 60-80 characters (ideal) / 50-100 characters (acceptable)
- **Minimum line height:** 1.5 for body text (24px for 16px font)
- **Letter spacing:** Increase 0.1–0.2px for all-caps labels

---

## 3. Component Specifications

### Card (FacilitySection Photo Grid)

```css
border-radius: 16px;  /* 2xl in Tailwind */
background: var(--color-surface);
box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);
overflow: hidden;
transition: transform 300ms ease, box-shadow 300ms ease;
```

**Hover State:**
- `transform: scale(1.05)` (5% scale up)
- `box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.5)`

### Video Container (FacilitySection)

```html
<video autoplay muted loop playsinline poster="/videos/{id}-poster.jpg">
  <source src="/videos/{id}.webm" type="video/webm">
</video>
```

**CSS:**
```css
width: 100%;
height: 100%;
object-fit: cover;
transition: transform 700ms ease;
```

**Hover:**
- `transform: scale(1.05)`

### Button (Primary CTA)

```css
padding: 16px 32px;  /* Fitts's Law: 44px minimum height */
border-radius: 12px;
background: var(--color-primary);
color: #FFFFFF;
font-weight: 600;
font-size: 16px;
cursor: pointer;
transition: background 200ms ease, transform 150ms ease;
```

**Hover:**
- `background: #6A1FFF` (10% darkened)
- `transform: translateY(-2px)`

**Active:**
- `background: #5A0FFF`
- `transform: translateY(0px)`

**Focus:**
- `outline: 2px solid var(--color-primary)`
- `outline-offset: 2px`

---

## 4. Spacing Scale

All margins and padding use **8px base unit**.

| Size | Value | Usage |
|------|-------|-------|
| xs | 4px | Micro spacing (rare) |
| sm | 8px | Compact spacing |
| md | 16px | Standard padding |
| lg | 24px | Section spacing |
| xl | 32px | Large gaps |
| 2xl | 48px | Major sections |
| 3xl | 64px | Full page sections |

---

## 5. Animation & Motion

### Scroll Reveal (GSAP ScrollTrigger)

```javascript
gsap.from(element, {
  opacity: 0,
  y: 40,
  duration: 0.8,
  ease: "power2.out",
  scrollTrigger: {
    trigger: element,
    start: "top 80%",
    toggleActions: "play none none reverse"
  }
})
```

### Hover Animations

- **Duration:** 200ms–300ms
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (standard ease-out)
- **Transform origin:** Center

### Video Fade In

```css
animation: fadeIn 0.25s ease;
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

## 6. Responsive Breakpoints

| Device | Width | Layout |
|--------|-------|--------|
| Mobile | 375px–640px | Single column, full-width cards |
| Tablet | 641px–1024px | 2-column grid (FacilitySection) |
| Desktop | 1025px+ | 4-column grid (FacilitySection) with asymmetric spans |

---

## 7. Dark Mode Defaults

All specifications above assume **dark theme** (`prefers-color-scheme: dark`).

- **Text:** `text-white` for primary, `text-gray-300` for secondary
- **Backgrounds:** `bg-[var(--color-bg)]` and `bg-[var(--color-surface)]`
- **Borders:** `border-[var(--color-primary)]/20` or `border-gray-700`

---

## Reference Sources

- **Color System:** yaoya.io electric purple + lime green palette (Phase 3d)
- **Typography:** System font stack (Apple/Google/Microsoft standards)
- **Components:** shadcn/ui + custom Tailwind extensions
- **Animation:** GSAP + native CSS animations

---

## Design Governance

1. **No hardcoded colors** — use CSS custom properties (`--color-*`)
2. **No magic numbers** — all spacing uses 8px unit or Tailwind scale
3. **Accessibility first** — WCAG AA on all interactive elements
4. **Performance:** CSS animations preferred over JS when possible
5. **Variants:** Hover, active, focus, disabled states required for all buttons/inputs
