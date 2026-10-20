---
title: CAD DXF Quote API
order: 2
kind: REST API
status: Launching soon
tagline: "Instant laser-cutting quotes from a DXF: exact cut length, pierce count, part area and BOM in one API call. No AI guesses, no zero-length surprises from splines or blocks."
summary: Reads any DXF and returns the numbers a cutting quote needs. Cut length, pierces, parts, holes, net area, bounding box and BOM.
description: DXF analysis API for laser, waterjet, plasma and CNC quoting. Exact cut length, pierce count, parts, holes, net area, bounding box and BOM from any DXF.
io:
  in: DXF R12 – R2018+ · ASCII & binary
  out: JSON · SVG preview
fact:
  value: "0.02 mm"
  label: cut-length agreement on 14 reference drawings
visual: plate
channels:
  - name: RapidAPI
    url: ""

features:
  - title: Exact cut length
    text: Exact formulas for lines, arcs, circles and rounded polylines; ellipses and splines measured on a fine flattening. Duplicate and overlapping lines are counted once.
  - title: Pierces per contour, not per entity
    text: A rectangle drawn as four separate lines is one pierce. Shared edges for common-line cutting are handled.
  - title: Parts, holes and net area
    text: Outlines and holes are told apart by nesting (islands inside holes count as parts). Net area is outline minus holes, for material cost and weight.
  - title: BOM from blocks
    text: Block references, including nested blocks and MINSERT arrays, with quantity, layer and attribute values such as inserts or material tags.
  - title: Ignores what is not cut
    text: Layers that are off or frozen, invisible entities, text, dimensions and hatches are skipped. Include or exclude layers by name, for example a title-block frame.
  - title: Warnings you can act on
    text: Open contours (gaps in the drawing) are flagged, and every skipped entity is listed with the reason.

specs:
  - label: Input
    value: DXF R12 to R2018+, ASCII and binary, including minimal hand-written or CAM-generated files
  - label: Entities
    value: LINE, ARC, CIRCLE, ELLIPSE, SPLINE, LWPOLYLINE (with bulges), POLYLINE/VERTEX; nested, scaled, rotated and mirrored blocks; MINSERT arrays
  - label: Returns
    value: Cut length, pierce count, closed and open contours, parts, holes, net area, bounding box, BOM, per-layer summary, warnings, SVG preview, optional per-contour detail
  - label: Units
    value: Any drawing unit; every value is also given in millimetres
  - label: Endpoints
    value: "`POST /v1/analyze-dxf` (file upload) · `POST /v1/analyze-dxf-raw` (JSON body, text or base64)"
  - label: Limits
    value: 25 MB per request
  - label: Engine
    value: Deterministic, no AI. The same drawing always gives the same numbers.

details_title: Request and fields
tested:
  - 14 reference drawings with analytic answers, ASCII and binary. Cut length within 0.02 mm; pierces and bounding box exact.
  - Net area within about 0.02 %.
  - "A 1000 × 500 mm perforated sheet with 2,500 holes: about 4 seconds, 2,501 pierces, cut length exact."
  - 3,600 randomly damaged files without a crash. Damaged entities are skipped and reported.
  - A 200 × 130 mm SolidWorks sign plate agrees with SolidWorks' own STL export within 0.5 % (area) and 0.7 % (cut length). The gap comes from the STL's chord approximation.
limits:
  - DWG is not supported. The API answers with a clear message asking for a DXF export.
  - Ellipses and splines are measured on a fine flattening rather than an exact formula.
  - Files without a unit are read as millimetres, with a warning.
  - Kerf compensation and lead-in / lead-out lengths are not included.
privacy_summary: Drawings are processed in memory and never stored.
---

```bash
curl -X POST "https://<host>/v1/analyze-dxf?exclude_layers=FRAME,DIMS" -F "file=@part.dxf"
```

| Field | Meaning |
|---|---|
| `total_cut_length` (+ `_mm`) | Length of everything that gets cut |
| `pierce_count` | One per closed contour, one per open path |
| `closed_loop_count`, `open_contour_count` | Closed contours and open paths; open ends trigger a warning |
| `part_count`, `hole_count`, `net_area` (+ `_mm2`) | Outlines and holes by nesting; outline area minus holes |
| `bounding_box` (+ `_mm`) | Extents of the cut geometry only |
| `bom_blocks` | Block references with quantity, layer and attribute values |
| `layer_summary`, `entity_counts_by_type` | Per-layer entity count and cut length; entity types used |
| `ignored_entities`, `warnings`, `file_info` | What was skipped and why; repaired or binary file info |
| `svg_preview` | Small vector preview of the cut geometry |
| `contours` (optional) | Each contour's role, length, area, pierces and bounding box |
