# SPEC

## §G GOAL
Portfolio navigation + stacked sections deterministic across SSR, hydration, route transitions, mobile scroll.

## §C CONSTRAINTS
- `next` + `framer-motion` + `@studio-freight/react-lenis`
- No change to `FolderSection.tsx` — desktop code path untouched
- Mobile = `<768px` viewport
- Desktop `useScroll` from framer-motion must remain active
- Use Lenis scroll events for mobile scroll tracking
- Homepage navbar reveal driven only by current hero intro completion
- Next.js root layout persists across client navigation

## §I INTERFACES
- file: `components/layout/StackedSections.tsx` — `scrollYProgress` → FolderSection
- lib: `@studio-freight/react-lenis` — `useLenis()` + `lenis.on('scroll', fn)`
- lib: `framer-motion` — `useScroll`, `useMotionValue`
- browser: `window.matchMedia('(max-width: 768px)')`
- file: `components/layout/Navbar.tsx` — pathname + `hero-phase2` → intro visibility
- file: `app/(home)/_components/HomeClient.tsx` — emits `hero-phase2` for current intro

## §V INVARIANTS
V1: Desktop scrollYProgress from framer-motion useScroll — exact same offset config
V2: Mobile progress computed via Lenis scroll + container `getBoundingClientRect`
V3: Progress value clamped [0, 1]
V4: Resize across breakpoint switches source without stale values
V5: No Lenis scroll event leak on unmount
V6: On `/`, navbar hidden during SSR + before every client paint until current intro emits `hero-phase2`; repeat visits reset readiness
V7: Unresolved server pathname fails closed; navbar SSR state hidden until client route resolves before paint

## §T TASKS
id|status|task|cites
T1|x|amend StackedSections: mobile Lenis scroll sync|V2,V3,V4,V5
T2|x|verify desktop unchanged — still uses framer-motion useScroll|V1
T3|x|replace stale navbar phase global + post-paint reset; add regression test|V6
T4|x|make navbar SSR visibility independent from server pathname resolution|V7

## §B BUGS
id|date|cause|fix|
B1|2026-06-03|useScroll reads native scrollY; Lenis mobile touch bypasses native scroll update → sticky dock → zero progress → no parallax|V2
B2|2026-08-08|root-layout navbar reused stale `__heroPhase2`; `useEffect` reset occurred after paint; 5s fallback revealed early|V6
B3|2026-08-08|Vercel prerender pathname unresolved; literal `/` check emitted visible navbar in static HTML|V7
