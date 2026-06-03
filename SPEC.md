# SPEC

## §G GOAL
Fix mobile stacked folder parallax — docked sections stop shifting on touch devices. Desktop unchanged.

## §C CONSTRAINTS
- `next` + `framer-motion` + `@studio-freight/react-lenis`
- No change to `FolderSection.tsx` — desktop code path untouched
- Mobile = `<768px` viewport
- Desktop `useScroll` from framer-motion must remain active
- Use Lenis scroll events for mobile scroll tracking

## §I INTERFACES
- file: `components/layout/StackedSections.tsx` — `scrollYProgress` → FolderSection
- lib: `@studio-freight/react-lenis` — `useLenis()` + `lenis.on('scroll', fn)`
- lib: `framer-motion` — `useScroll`, `useMotionValue`
- browser: `window.matchMedia('(max-width: 768px)')`

## §V INVARIANTS
V1: Desktop scrollYProgress from framer-motion useScroll — exact same offset config
V2: Mobile progress computed via Lenis scroll + container `getBoundingClientRect`
V3: Progress value clamped [0, 1]
V4: Resize across breakpoint switches source without stale values
V5: No Lenis scroll event leak on unmount

## §T TASKS
id|status|task|cites
T1|x|amend StackedSections: mobile Lenis scroll sync|V2,V3,V4,V5
T2|x|verify desktop unchanged — still uses framer-motion useScroll|V1

## §B BUGS
id|date|cause|fix|
B1|2026-06-03|useScroll reads native scrollY; Lenis mobile touch bypasses native scroll update → sticky dock → zero progress → no parallax|V2