# Universal Dynamic Tooltip System

## Architecture Overview
The tooltip system is designed to be highly performant, globally available, and layout-agnostic. 

- **`TooltipProvider`**: Global React Context managing `isVisible` and `content` state.
- **`TooltipRenderer`**: Root-level fixed component injected in `layout.tsx`. Uses Framer Motion's `useMotionValue` and `useSpring` to track the mouse coordinates globally. By mutating motion values directly, it tracks the cursor at 60fps+ without triggering heavy React re-renders.
- **`TooltipWrapper`**: A helper component to quickly wrap any UI element with standard tooltip behavior.

## Solved Problems & Hard-Won Lessons

### 1. The Invisible Shield Problem (Z-Index Overlap)
**Problem**: Absolute positioned layout items (like the timeline nodes or section headers) have massive invisible bounding boxes. If Node 2 rendered after Node 1, Node 2's invisible empty space sat perfectly on top of Node 1, completely severing its hover hitbox.
**Solution**: 
- Applied `pointer-events-none` to ALL wrapper containers and decorative layout elements (like poles and dots).
- Applied `pointer-events-auto` strictly to the interactive surface area (the text flag).
- **Rule**: Empty space must always be a ghost to the mouse.

### 2. Timeout Race Conditions (The Disappearing Tooltip)
**Problem**: When hovering rapidly from Node A to Node B, Node A's `hideTooltip` scheduled a 200ms timeout to clear the content. This timeout would execute *while* Node B was being hovered, causing the tooltip to vanish mid-animation.
**Solution**: Wrapped the destruction timeout in a `useRef`. Any time `showTooltip` is fired, it instantly runs `clearTimeout`, killing the old destruction command and handing off the content seamlessly.

### 3. Text Reflow (The Squish Effect)
**Problem**: Animating a container's `width` from `0` to `"auto"` causes text to aggressively line-wrap and squish during the animation as the available width grows.
**Solution**: Inside the `motion.div`, the content is wrapped in a `<div className="w-max">`. This forces the content to calculate its layout based on infinite horizontal space, instantly rendering at its final dimensions. The outer `motion.div` then simply acts as an expanding `overflow: hidden` mask revealing it.

### 4. Network Latency (The Blank Image Pop)
**Problem**: Tooltips with external images would show a blank square upon hovering because the browser only initiated the network fetch when the tooltip mounted.
**Solution**: Injected a `<div className="hidden">` array of `<img>` tags at the bottom of the parent `ExperienceSection`. The browser fetches and caches all images silently on page load, resulting in 0ms instant rendering on hover.

### 5. Chat Tail Detachment
**Problem**: Adding a diagonal cut chat tail using `clip-path` next to a container with a heavy border radius (`rounded-xl`) caused the tail's flat edge to miss the curve, leaving a gap.
**Solution**: Flattened the anchor corner specifically (`rounded-tl-sm`) so the diagonal tail seamlessly merges into a sharp edge without exposing the border curve gap.

## Future Usage
To use this in other sections:
1. Wrap your trigger element with `onMouseEnter={() => showTooltip(<YourComponent />)}` and `onMouseLeave={hideTooltip}`.
2. If the tooltip requires external assets (like images), implement an invisible preloader in the parent section.
