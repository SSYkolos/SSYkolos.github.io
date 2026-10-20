---
title: DXF cut length calculator
h1: DXF cut length calculator
product: dxf-quote-api
order: 1
summary: Exact cut length of a DXF for laser, waterjet, plasma or CNC quotes, duplicates counted once.
description: Calculate the cut length of a DXF drawing for laser, waterjet, plasma and CNC quoting. Exact for arcs and rounded polylines, duplicate lines counted once, texts and dimensions ignored. Free, no sign-up.
lede: Drop a DXF drawing below and get the total cut length in millimetres, measured the way a cutting quote needs it, plus pierces, net area and a preview.
try_intro: "Your drawing is read in memory and discarded right after. Use “Ignore layers” for a title-block frame or a dimension layer. The sample tabs show three drawings with their full results."
steps:
  - "Export the part or flat pattern as **DXF** (any version from R12 to R2018+, ASCII or binary). DWG needs a DXF export first."
  - "Drop it into the box above. If the drawing has a frame or dimensions on their own layer, list that layer under “Ignore layers”."
  - "Read the cut length in mm, with pierces, parts and holes, net area and bounding box, ready for your price formula."
body_title: How the length is measured
faq:
  - q: How exact is the cut length?
    a: "Lines, arcs, circles and rounded polyline segments (bulges) are measured with exact formulas. Ellipses and splines are measured on a fine flattening. On 14 reference drawings with known answers the result was within 0.02 mm."
  - q: What if lines are drawn twice or overlap?
    a: "Duplicate and overlapping lines are counted once, and the response says how much length was removed, so a doubled edge does not double the price."
  - q: Are texts, dimensions and hatches counted?
    a: "No. TEXT, DIMENSION, HATCH and other non-cut entities are skipped and listed as ignored, as are layers that are switched off or frozen. You can also ignore layers by name."
  - q: What units does it use?
    a: "Any drawing unit; every value is also given in millimetres. A drawing without a unit is read as millimetres, with a warning."
  - q: Can it read DWG files?
    a: "No, DWG is AutoCAD's closed format. Export a DXF first: in AutoCAD with Save As, in SolidWorks with Save As .dxf, in Fusion 360 by saving the sketch as DXF."
  - q: Is my drawing stored?
    a: "No. The demo service reads it in memory and discards it right after sending the result back."
---

The cut length is the total length of every contour that will be cut. A few things make that number different from a
naive sum of all entities in the file:

- **Blocks are expanded:** nested, scaled, rotated and mirrored block references and MINSERT arrays are measured
  where they are placed, as many times as they appear.
- **Hidden geometry is left out:** layers that are off or frozen, invisible entities and, if you ask, whole layers by name.
- **Open contours are reported:** a gap in the drawing gets a warning, because each open path needs its own pierce.

In one test, a 1000 × 500 mm perforated sheet with 2,500 holes took about four seconds and gave the exact length.
A 200 × 130 mm SolidWorks sign plate agreed with SolidWorks' own STL export within 0.7 %, the difference coming from
the STL's straight-line approximation of curves.
