---
title: Count pierces in a DXF
h1: Count the pierces in a DXF drawing
product: dxf-quote-api
order: 2
summary: Pierces per contour, not per entity, for laser and plasma quotes. Open contours flagged.
description: Count the pierces in a DXF for laser, plasma and waterjet quoting - one per closed contour, not per line - with open contours and gaps flagged. Free, no sign-up.
lede: Pierce count drives cutting time as much as length does. Drop a DXF below to see how many pierces it really needs, contour by contour.
try_intro: "Your drawing is read in memory and discarded right after. The second sample tab, “Messy export”, has a rectangle drawn as loose lines and a cut-out with a 0.5 mm gap."
steps:
  - "Export the part as **DXF** and drop it into the box above."
  - "The pierce count is one per closed contour plus one per open path, after loose lines and arcs have been joined into contours."
  - "If the result has open contours, check the warning: a gap in the drawing costs an extra pierce, and often means a mistake in the drawing."
body_title: Why counting entities gives the wrong number
faq:
  - q: Why is the pierce count not the number of entities?
    a: "A rectangle drawn as four separate lines is still one contour, so it needs one pierce, not four. The engine joins lines, arcs and polylines that touch into contours first, then counts one pierce per contour."
  - q: What happens with gaps in the drawing?
    a: "A contour that does not close is an open path. Each open path needs its own pierce, and the result includes a warning that the drawing may have gaps."
  - q: What about parts that share an edge (common-line cutting)?
    a: "Shared edges are handled: parts laid out to share a cut are not reported as gaps, and the shared edge is counted once in the cut length."
  - q: Does it tell parts and holes apart?
    a: "Yes, by nesting: a closed contour inside another is a hole, and a contour inside a hole counts as a part again. The result has the number of parts and holes and the net area."
  - q: Is my drawing stored?
    a: "No. The demo service reads it in memory and discards it right after sending the result back."
---

Many home-made DXF tools count one pierce per LINE, ARC or CIRCLE entity. For a part exported from CAD as loose
segments that overestimates badly, and for a polyline it is right only by accident. Here the count follows the
geometry:

| Drawing | Entities | Pierces |
|---|---|---|
| Rectangle drawn as 4 lines | 4 | 1 |
| Plate with 4 round holes and a slot drawn as 2 lines + 2 arcs | 10 | 7 (outline, 4 holes, bore, slot) |
| Cut-out polyline with a 0.5 mm gap | 1 | 1, plus a gap warning |

The second row is the “Mounting plate” sample above, and its numbers are the engine's real output. In a test sheet
with 2,500 holes the engine reported 2,501 pierces: the outline plus every hole.
