# SPEC

## §G GOAL
Portfolio navigation + intrinsic-height stacked sections deterministic across SSR, hydration, resize, route transitions, all scroll sources.

## §C CONSTRAINTS
- `next` + `framer-motion` + `lenis/react`
- Preserve folder visual style, About `460px` desktop composition, Experience `500px` desktop timeline, Projects/Footer structure
- Mobile = `(width < 48rem)`; exact `768px` desktop
- Lenis scroll events primary; native scroll fallback
- Layout CSS content-driven; JS observes geometry + drives motion only
- Homepage navbar reveal driven only by current hero intro completion
- Next.js root layout persists across client navigation

## §I INTERFACES
- file: `components/layout/stackGeometry.ts` — anchors + stack tops → ranges/progress/dock mode
- file: `components/layout/FolderSection.tsx` — anchor/root refs + responsive stack top + dock mode
- file: `components/layout/StackedSections.tsx` — cached geometry → MotionValue progress
- lib: `lenis/react` — `useLenis()` + `lenis.on('scroll', fn)`
- lib: `framer-motion` — `useMotionValue`
- browser: `ResizeObserver`, `requestAnimationFrame`, `window.matchMedia('(width < 48rem)')`
- file: `components/layout/Navbar.tsx` — pathname + `hero-phase2` → intro visibility
- file: `app/(home)/_components/HomeClient.tsx` — emits `hero-phase2` for current intro
- file: `components/providers/LenisProvider.tsx` — Lenis smooth wheel + immediate direction reversal + programmatic scroll context

## §V INVARIANTS
V1: Desktop + mobile stack progress share measured geometry path; no viewport-height timing algebra
V2: Scroll callback reads cached numbers only; no layout/style read per scroll
V3: Progress value clamped [0, 1]
V4: Resize/content/font/hero geometry change remeasures before next motion update
V5: No Lenis/native/resize/observer/rAF leak on unmount
V6: On `/`, navbar hidden during SSR + before every client paint until current intro emits `hero-phase2`; repeat visits reset readiness
V7: Unresolved server pathname fails closed; navbar SSR state hidden until client route resolves before paint
V8: About + Experience folder roots intrinsic-height when fitting; crop mode caps shell only; Projects natural-height unchanged
V9: Folder height `≤ 100svh - stackTop - 8px` → intrinsic whole-folder sticky; taller → whole-folder sticky + shell capped to budget + body clipped
V10: Stack top single source drives sticky CSS, progress ranges, Folder/Navbar/Footer navigation
V11: About fade = About dock→Experience dock; Experience fade = Experience dock→Projects arrival; parallax = About dock→Projects arrival
V12: Exact `768px` uses desktop CSS + JS behavior
V13: Tall About uses attached whole-folder flow; tall Experience uses whole-folder viewport crop; neither creates nested scrolling or detached tab
V14: Folder colors/type/tabs/radii/borders, About desktop composition, Experience desktop timeline, Projects/Footer structure unchanged
V15: Intrinsic folder child outer spacing cannot reduce parent scroll height below rendered descendants
V16: Each following folder root overlaps prior root by exact responsive tab-row height; no inter-folder visual band
V17: Desktop Experience content layout inset = 24px lower; intrinsic root height includes inset
V18: Stack geometry + section navigation resolve folder root layout position, never preceding zero-height anchor
V19: Adjacent folders compensate positive parallax-offset delta with identical animated surface; visual body gap remains 0px across progress [0,1]
V20: Crop-mode selection uses uncropped intrinsic body height; ResizeObserver remeasure cannot oscillate folder↔crop
V21: About/Experience/Projects content each owns `py-16 md:py-24`; Projects Footer stays outside content padding
V22: Section positioning inset participates in layout; transforms cannot consume opposite-side content padding
V23: Crop mode reserves top/bottom content padding outside inner overflow clip; oversized descendants cannot paint through breathing room
V24: About content has no inner overflow clip; oversized About disables docking/parallax and flows with tab attached
V25: Wheel input stays Lenis-smoothed (`smoothWheel: true`); opposite-direction wheel resets queued momentum before same delta applies
V26: Project Archive controls navigate to `/projects`; `/projects` route renders 2-column archive with hash modal
V27: Each featured project has unique metadata slug + repo/link target + existing thumbnail, small-video, poster assets
V28: Project perf compare uses production Chromium 1366×768, 4× CPU, 5s frame sample; retain only non-regressing cadence + unchanged card geometry
V29: Muted featured Project preview MP4 assets contain video only; no unused audio stream
V30: Project backdrop blur stays visually same without forced transform compositing layer

## §T TASKS
id|status|task|cites
T1|x|amend StackedSections: mobile Lenis scroll sync|V2,V3,V4,V5
T2|x|legacy desktop `useScroll` verification; superseded by measured path T7|-
T3|x|replace stale navbar phase global + post-paint reset; add regression test|V6
T4|x|make navbar SSR visibility independent from server pathname resolution|V7
T5|x|add pure stack geometry + regression tests|V1,V2,V3,V9,V11,V12
T6|x|refactor FolderSection + About/Experience intrinsic layout|V8,V9,V10,V13,V14
T7|x|wire measured motion, navigation, sky remeasurement|V1,V2,V3,V4,V5,V10,V11,V12
T8|x|verify tests/scoped lint/build + responsive runtime matrix|V3,V8,V9,V11,V12,V13,V14,V15
T9|x|fix inter-folder seam + add nonterminal content breathing room|V13,V14,V16
T10|x|fix Experience→Projects seam color + lower Experience content|V14,V16,V17
T11|x|replace bleed band with tab-row root overlap + root geometry targets|V10,V11,V16,V18
T12|x|compensate parallax-created Experience→Projects seam with motion-matched surface|V14,V16,V19
T13|x|replace detached sticky-tab fallback with whole-folder viewport crop|V8,V9,V13,V20
T14|x|add shared responsive vertical padding to all three section contents|V14,V21
T15|x|make padding visibly larger + restrict clipping to Experience timeline|V13,V14,V21,V23,V24
T16|x|keep Lenis smooth wheel + cancel stale momentum on reversal + regression test|V25,I.LenisProvider
T17|x|disable Project Archive controls while preserving visible affordances|V26
T18|x|replace Rupiyeah placeholder with BIMAyKRS project + approved demo video|V27
T19|x|strip muted preview audio; add repeatable perf/media checks|V14,V28,V29
T20|x|remove forced Project backdrop transform layer; trace scroll cadence + visual regression|V14,V28,V30
T21|x|create /projects 2-column magazine archive + wire landing/nav/footer controls|V26,V27


## §B BUGS
id|date|cause|fix|
B1|2026-06-03|useScroll reads native scrollY; Lenis mobile touch bypasses native scroll update → sticky dock → zero progress → no parallax|V2
B2|2026-08-08|root-layout navbar reused stale `__heroPhase2`; `useEffect` reset occurred after paint; 5s fallback revealed early|V6
B3|2026-08-08|Vercel prerender pathname unresolved; literal `/` check emitted visible navbar in static HTML|V7
B4|2026-08-08|Experience legacy `min-height:900px` negative outer margin shrank intrinsic parent 48px while fixed timeline still painted → bottom clip|V15
B5|2026-08-08|Intrinsic root ended before next transparent tab row; legacy bleed lived inside `overflow-hidden` body → page-background seam|V16
B6|2026-08-08|Bleed inherited near-black base during transition → Experience→Projects row still read as page gap|V16
B7|2026-08-08|Intrinsic Experience header retained old absolute offset → desktop content sat too near folder top|V17
B8|2026-08-08|Opaque bleed hid page background but created visible strip between every intrinsic folder root|V16,V18
B9|2026-08-08|Static tab overlap ignored differing root transforms; Experience -60px vs Projects 0px reopened up to 60px seam during parallax|V19
B10|2026-08-08|Tall-folder fallback docked tab separately while body flowed; mobile/zoom made folder visually detach|V9,V13,V20
B11|2026-08-08|Experience `translate-y-6` moved pixels without layout height; 64px bottom padding rendered as 40px|V17,V21,V22
B12|2026-08-08|Crop overflow applied outside padded wrapper; oversized content painted through bottom padding before shell clip|V21,V23
B13|2026-08-08|New desktop 64px matched About legacy 32px shell + 32px inner spacing; visual distance stayed unchanged|V21
B14|2026-08-08|Generic inner crop clipped About `ProfileFlipCard` upward animation despite crop intent applying only to timeline|V23,V24
B15|2026-08-08|`smoothWheel:true` + `lerp:0.15` kept Lenis target ahead of rendered scroll; upward ticks first canceled queued downward distance|V25
B16|2026-08-12|Project 50%-visibility video cull cut controlled Chromium cadence 60→30fps|revert; retain only measured non-regressing perf changes
B17|2026-08-30|SessionStorage intro flag persisted across hard page reload (F5) → skipped loading & intro animation on refresh|switch to in-memory session flag
B18|2026-08-30|Dynamic import latency + initial simTimeMs 0 reset caused slow cloud mount & low FPS on revisit|import AsciiClouds statically; preserve simTimeMs
B19|2026-08-30|Duplicate popstate/hash effects in ClientProjectModal + onTransitionEnd poster state desync|unify modal effects; make poster overlay declarative
