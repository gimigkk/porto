# Design Brief: Experience Section

## Problem

Visitors need a clear, scannable way to understand professional history and the relative impact of past roles. Standard text lists are dense and fail to visually communicate growth or the scale of achievements.

## Solution

A data-driven horizontal timeline (falling back to a vertical layout on mobile screens). The timeline uses solid dots at each data point, with the dot's size mapped to the "impressiveness" or impact of the role. Alternating flags extend from the dots to display the start/end dates, separated by a line from the role and company name, preventing visual crowding.

## Experience Principles

1. Visual weight = Impact -- The size of the dot instantly communicates the significance of a particular role.
2. Spatial harmony -- Alternating flags ensure text remains legible and uncluttered even when dates are close together.
3. Adaptive clarity -- The layout gracefully collapses into a vertical orientation on mobile to preserve readability.

## Aesthetic Direction

- **Philosophy**: Minimalist Data Visualization
- **Tone**: Clean, professional, precise
- **Reference points**: Infographics with alternating data nodes and minimalist typography (similar to the provided reference image).
- **Anti-references**: Cluttered, heavy corporate resumes; dense blocks of text.

## Existing Patterns

- **Framework**: React / Next.js 16
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion (for smooth load-in animations)
- **Data**: JSON-driven approach for modularity

## Component Inventory

| Component | Status | Notes |
| --------- | ------ | ----- |
| `ExperienceSection` | New | Main container for the timeline. |
| `TimelineNode` | New | Individual data point rendering the dot, flag line, dates, role, and company. |
| `experience.json` | New | Data source storing the modular experience entries, including the `impressiveness` metric. |

## Key Interactions

- **Scroll Reveal**: The timeline and its nodes should fade/slide into view as the user scrolls them into the viewport.
- **Hover State**: (Optional) Hovering a node might slightly brighten or scale the dot/flag to indicate focus, though it remains primarily static.

## Responsive Behavior

- **Desktop (md and up)**: A continuous horizontal line across the section with alternating top/bottom flags.
- **Mobile (below md)**: A single vertical line on the left side, with all flags extending to the right to fit narrow viewports.

## Accessibility Requirements

- Adequate color contrast for the timeline lines, dots, and text against the background.
- Semantic HTML (e.g., using a list structure `<ul>`/`<li>` behind the scenes if possible, or ARIA labels) to ensure screen readers can understand the sequence.

## Out of Scope

- Clickable modals for expanding roles with long paragraphs of text. (Keeping it static/scannable for now).
