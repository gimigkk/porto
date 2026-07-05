# Build Tasks: Experience Section

Generated from: .design/experience-section/DESIGN_BRIEF.md
Date: 2026-07-05

## Foundation
- [ ] **Data Model**: Create `lib/data/experience.json` with modular data points (start/end dates, role, company, impressiveness 1-10). _New file._
- [ ] **Type Definitions**: Create `types/experience.ts` to define the TypeScript interface for the JSON data. _New file._

## Core UI
- [ ] **ExperienceContainer**: Create `components/home/ExperienceSection.tsx`. Implement the section wrapper, section title, and the main layout grid. Includes the primary continuous line (horizontal on desktop, vertical on mobile). _New component._
- [ ] **TimelineNode**: Create `components/home/ExperienceNode.tsx`. Implement the solid dot mapping `impressiveness` to dynamic `rem` size, the alternating flag line, and the text layout (date line, role, company). _New component. Depends on: Data Model._

## Interactions & States
- [ ] **Scroll Reveal**: Add `framer-motion` variants to `ExperienceSection` (stagger children) and `ExperienceNode` (fade and slide into position based on its alternating top/bottom location) so they animate when entering the viewport. Covers: initial load, scroll-into-view.

## Responsive & Polish
- [ ] **Mobile Layout**: Adjust `ExperienceSection` and `ExperienceNode` to collapse into a vertical timeline (`flex-col`) below the `md` breakpoint. Ensure all flags point horizontally on mobile to fit the screen width without overlapping. Breakpoints: `md`.
- [ ] **Accessibility pass**: Ensure semantic grouping and adequate color contrast. Add visually hidden text or `aria-labels` so screen readers interpret the visual layout correctly.

## Review
- [ ] **Design review**: Run /design-review against the brief.
