---
name: perf-opt
description: "React/Next.js performance optimization focus. Scans for re-render storms, layout thrash, bundle bloat, animation jank. Always-on when perf task detected."
---

# perf-opt — frontend performance focus

Always-on when perf-related task. Before writing perf code or reviewing perf, check checklist.

## ARCHITECTURAL BEST PRACTICES
- **Default to Server Components:** Keep heavy logic and dependencies off the client. Use `"use client"` ONLY when interactivity (hooks, state, event listeners) is strictly necessary.
- **Eliminate Waterfalls:** Never await independent data requests sequentially. Use `Promise.all()` to execute them in parallel.
- **Leverage Suspense:** Wrap independent page sections in React `<Suspense>` to stream UI to the client instantly.

## RENDER PERFORMANCE

### React re-render prevention
- `React.memo` on components with stable props (list items, cards, sections)
- `useMemo` for derived data (filtered lists, computed styles, memoized objects passed as deps)
- `useCallback` for callbacks passed to memo'd children
- Factor: is this value/callback *semantically* new each render? If not, memoize.
- `key` props correct — no index keys on dynamic lists

### State & context
- Split context: coarse context causes cascading re-renders. Separate data+dispatch.
- Colocate state: push state down to lowest common ancestor. Don't lift unnecessarily.
- `useReducer` if state shape complex — stable dispatch identity, atomic updates
- `useSyncExternalStore` for external subscriptions (scroll, resize, intersection observers)
- Avoid `useState` for derived state — compute from props or other state instead
- **Direct DOM updates for rapid changes**: Decouple rapid updates (progress bars, timers) from React state. Attach a `useRef` to the element and update its `style` directly via `setInterval` or `requestAnimationFrame` to drop React overhead to zero.

### Layout effects
- `useLayoutEffect` only for measurable DOM mutations (ref measurements, scroll position).
- Prefer `useEffect` for side effects — `useLayoutEffect` blocks paint.
- Avoid reading layout-triggering properties in render (offsetTop, scrollTop, getBoundingClientRect)

## ANIMATION JANK

### framer-motion specific
- `layoutAnimation` on sibling count change — framer-motion recalculates layout of all siblings. Use `layoutId` + `AnimatePresence` mode="popLayout" instead.
- `willChange` — framer-motion sets `transform` level. For GPU-accelerated opacity/transform, set `willChange: "transform"` on animated elements.
- `animate` vs `initial` — avoid inline object literals in JSX (new ref each render). Extract to const outside component or use `useMemo`.
- **TypeScript Easing**: When extracting `ease: [0.22, 1, 0.36, 1]` arrays to constants, append `as const` so TS infers the `Easing` tuple rather than a generic `number[]`.
- `whileHover`/`whileTap` — prefer CSS transitions for simple hovers. framer-motion JS-driven hover adds frame budget.
- `AnimatePresence` — use `mode="wait"` or `"popLayout"` not default `"sync"` to reduce layout thrash.
- Reduce animated element count. Animate container, not children.

### Canvas / WebGL (AsciiClouds etc.)
- `requestAnimationFrame` loop: check if tab visible (doc.hidden) → pause
- Offload heavy compute to workers or use RAF cooldown when scrolled away
- Batch draw calls. Minimize state changes between draws.
- `canvas.width/height` reset clears canvas — only set on resize
- Use `ImageBitmap` for static image sources in canvas
- Check device capability: skip heavy animation on low-end (`navigator.hardwareConcurrency <= 4`)

## LAYOUT & CSS PERFORMANCE

- Avoid layout thrashing: batch DOM reads then batch writes (or use `FastDom` / `requestAnimationFrame` batching)
- **Scroll Syncing**: Never read `window.scrollY` inside a scroll event loop if animating. Read cached scroll objects (like Lenis `e.scroll` or Framer `scrollY`) to bypass forced synchronous layout recalculation.
- CSS containment: `contain: layout style paint` on heavy sections / offscreen cards
- `content-visibility: auto` on long scroll sections (auto lazy-render)
- Avoid `top`/`left` animations — use `transform: translate()` (GPU composited)
- Avoid `width`/`height` animations — use `transform: scale()`
- Prefer `opacity` + `transform` for animations. Everything else triggers layout.
- Reduce selector complexity in Tailwind: many arbitrary values? extract to config
- `@container` queries over `matchMedia` listeners where possible

## BUNDLE & LOAD

### Code splitting
- Dynamic imports for heavy components: `next/dynamic` with `ssr: false` for client-only
- Route-level code splitting already handled by Next.js App Router
- Component-level: lazy-load modals, heavy visualizations, MDX renderers
- `React.lazy` + `<Suspense>` for non-Next.js code splitting

### Image optimization
- Use `next/image` — automatic sizing, format negotiation (AVIF/WebP), lazy loading
- Set explicit `width`/`height` to prevent CLS
- `priority` on above-the-fold images only (rare — LCP-critical)
- Blur placeholders for below-the-fold images
- Avoid `fill` without parent `position: relative` with known aspect ratio
- **NEVER use hidden `<div>` preloading**: Do not dump raw `<img>` tags in a `hidden` div to "preload" hover assets. This chokes the network waterfall and blocks LCP assets. Use `<link rel="preload">` or preload on hover intent.

### Scripts & Third-Party
- Use `next/script` component. Set `strategy="lazyOnload"` for analytics and non-critical scripts to prevent main-thread blocking.

### Fonts
- `next/font` with `display: swap` (default) — no FOIT
- Subset fonts: `subsets: ["latin"]` — already done in layout
- Preload font CSS: `preload: true` on critical fonts
- **Strict Weight Subsetting**: Verify you only request the exact weights used in code. Requesting `[200,300,400,500,600,700]` downloads 6 files and chokes the network.
- Limit font variants — each weight/style adds download

### JS bundle
- Monitor `next build` output for large chunks
- Heavy libs (mermaid, shiki, three.js): dynamic import, lazy load
- Tree-shake: `import { iconName } from 'lucide-react'` not `import * as`
- Remove unused deps (`depcheck` or manual audit)
- Avoid barrel files (`index.ts` re-exports) — they prevent tree-shaking

## SCROLL & INTERACTION

- Passive event listeners: `{ passive: true }` on scroll/touchmove/wheel (Next.js `onScroll` is passive by default)
- Throttle/debounce scroll handlers: `requestAnimationFrame` throttle not setTimeout
- `IntersectionObserver` for visibility-based triggers (animations, lazy load) over scroll listeners
- `ResizeObserver` for element size changes over window resize + offsetWidth reads
- `useRef` for persistent values in effect closures — avoids stale closure + re-subscription

## MEMORY

- Clean up subscriptions in `useEffect` return (scroll listeners, observers, intervals)
- Avoid storing large data in state/context — reference via ref or external store
- Canvas/WebGL: release textures, buffers, geometries on unmount
- `URL.createObjectURL` — revoke with `URL.revokeObjectURL` on cleanup
- `AbortController` for fetch cleanup on unmount

## NEXT.JS SPECIFIC

- `useSearchParams` — wraps in `<Suspense>` boundary (causes client-side bailout)
- Dynamic routes: `generateStaticParams` for SSG where content is stable
- `revalidate` / `fetch cache` for ISR/data cache
- Avoid `'use client'` when server component sufficient. Push interactivity to leaf components.
- Server Components: heavy deps stay server-side (not in client bundle)
- `next/dynamic` with `loading` for skeleton states

## MEASUREMENT

- Use `@welldone-software/why-did-you-render` (already installed and active in Dev mode) to log the exact cause of component re-renders to the browser console. This is the primary empirical tool for finding React render loops. To use it, add `Component.whyDidYouRender = true` to any suspected component.
- Use React DevTools Profiler for render flamegraphs
- Chrome DevTools Performance panel for layout/frame analysis
- `performance.mark` / `performance.measure` for custom metrics
- Cross-check: `next build` output → largest chunks → profile on actual device throttling
- Lighthouse CI for regression detection
- FPS monitor during animation: `requestAnimationFrame` counting

## CHECKLIST (run before deeming perf work done)

- [ ] Memo'd components that receive stable props
- [ ] No inline object/function literals in animated component JSX
- [ ] Heavy components dynamically imported
- [ ] Images use `next/image` with dimensions
- [ ] Canvas/RAF loops pause when tab hidden
- [ ] Passive scroll listeners
- [ ] Animations use composited-only props (transform, opacity)
- [ ] Context scope as narrow as possible
- [ ] No layout thrash pattern (read/write interleaving bypassed via cached scroll values)
- [ ] Bundle size checked (`next build` output sane)
- [ ] Font weights strictly subset to only what is used
- [ ] Rapid DOM updates (progress bars) decoupled from React state using refs