# Design

## Aesthetic direction
An editorial green-and-stone research workspace: calm typography, a people directory, dotted graph canvas, and a persistent evidence inspector.

## Dials
- Design variance: 5/10
- Motion intensity: 2/10
- Visual density: 5/10

## Typography
- Display and body: Outfit, weights 400–700, Google Fonts CSS.
- Fallback: sans-serif.
- Body line-height: 1.55; prose capped to approximately 65 characters.
- Headline tracking: -1.6px; workspace title: -0.5px.

## Color tokens
- Background: #f4f6f2
- Paper: #fcfdfa
- Ink: #21332d
- Muted: #5c6b64
- Border: #dbe2da
- Accent: #256d5a
- Soft accent: #e5eee7
- Error: #9c3030
- Shadows use tinted ink at low opacity.

## Layout
- Maximum page width: 1600px; 4% horizontal padding, 16px on mobile.
- Desktop graph workspace: 225px directory, flexible canvas, 240px inspector.
- Below 1100px: inspector moves below the graph.
- Below 700px: single column; people directory becomes a horizontal strip.
- Node: 244 × 108px, radius 9px; 276px horizontal pitch, 180px vertical pitch.

## Motion
Minimal UI motion. Loading uses opacity only. Reduced-motion preferences disable animation. Native graph panning and zooming are direct manipulations, not ornamental animation.

## Components
Brand mark, company search, people directory, department filter, SVG person node, inspector, graph navigation controls, evidence legend, connection dialog, person editor, status/error line.

## Project rules
- No purple-blue gradients, fabricated statistics, or decorative profile photos.
- Initials identify people; sources are shown through links and excerpts.
- Solid links mean user-confirmed evidence; dashed links mean inferred.
- The example always carries a fictional label.
- Native focus outlines and explicit input labels are required.
- Touch controls are at least 44px on mobile.

## Last updated
2026-10-09 — first implementation of the LinkedIn people graph workspace.

2026-10-09 — added a keyless research dialog, scoped search links, clipboard preview rows and explicit selection before graph creation.
