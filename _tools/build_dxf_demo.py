"""Build the CAD DXF Quote API demo for the website.

Draws three sample DXF files with ezdxf, saves them to assets/demo/ (downloadable) and writes
the engine's real output to _data/demos/dxf.json. Run it with the CAD project's own Python:

    ..\\cad-dxf-bom-api\\.venv\\Scripts\\python _tools\\build_dxf_demo.py
"""
from __future__ import annotations

import io
import json
import math
import sys
from pathlib import Path

import ezdxf

SITE = Path(__file__).resolve().parents[1]
ENGINE = SITE.parent / "cad-dxf-bom-api"
sys.path.insert(0, str(ENGINE))

from cadquote import analyze_dxf_bytes  # noqa: E402

OUT_FILES = SITE / "assets" / "demo"
OUT_DATA = SITE / "_data" / "demos" / "dxf.json"
BULGE_90 = math.tan(math.radians(90) / 4)


def new_doc():
    doc = ezdxf.new("R2018", setup=True)
    doc.header["$INSUNITS"] = 4  # millimetres
    return doc, doc.modelspace()


def to_bytes(doc) -> bytes:
    s = io.StringIO()
    doc.write(s)
    return s.getvalue().encode("utf-8")


def rect(space, x, y, w, h, **attrs):
    return space.add_lwpolyline([(x, y), (x + w, y), (x + w, y + h), (x, y + h)], close=True, dxfattribs=attrs)


def mounting_plate():
    """160 x 100 plate, rounded corners, four Ø9 holes, a Ø30 bore and a slot drawn as loose lines and arcs."""
    doc, msp = new_doc()
    r, w, h, b = 8, 160, 100, BULGE_90
    msp.add_lwpolyline([
        (r, 0, 0, 0, 0), (w - r, 0, 0, 0, b), (w, r, 0, 0, 0), (w, h - r, 0, 0, b),
        (w - r, h, 0, 0, 0), (r, h, 0, 0, b), (0, h - r, 0, 0, 0), (0, r, 0, 0, b),
    ], format="xyseb", close=True)
    for x, y in [(15, 15), (w - 15, 15), (15, h - 15), (w - 15, h - 15)]:
        msp.add_circle((x, y), 4.5)
    msp.add_circle((55, 50), 15)
    # slot 40 x 10, as separate entities (chained into one contour by the engine)
    msp.add_line((95, 45), (125, 45))
    msp.add_line((95, 55), (125, 55))
    msp.add_arc((95, 50), 5, 90, 270)
    msp.add_arc((125, 50), 5, 270, 90)
    return doc, {}


def messy_export():
    """A typical export: frame and dimensions on their own layers, a doubled line, a text, and a 0.5 mm gap."""
    doc, msp = new_doc()
    doc.layers.add("FRAME")
    doc.layers.add("DIMS")
    for a, b in [((0, 0), (200, 0)), ((200, 0), (200, 120)), ((200, 120), (0, 120)), ((0, 120), (0, 0))]:
        msp.add_line(a, b)
    msp.add_line((50, 0), (150, 0))  # drawn twice: must not be cut twice
    msp.add_lwpolyline([(30, 30), (90, 30), (90, 90), (30, 90), (30, 30.5)])  # cutout with a 0.5 mm gap
    msp.add_circle((150, 60), 20)
    msp.add_text("PART-B  S235  t=3", dxfattribs={"height": 5}).set_placement((110, 100))
    rect(msp, -20, -20, 240, 160, layer="FRAME")
    msp.add_linear_dim(base=(0, -10), p1=(0, 0), p2=(200, 0), dxfattribs={"layer": "DIMS"}).render()
    return doc, {"exclude_layers": ["FRAME"]}


def nested_sheet():
    """A 3 x 2 array (MINSERT) of a bracket block that carries two press-in nut blocks with attributes."""
    doc, msp = new_doc()
    nut = doc.blocks.new("PEM_NUT_M4")
    nut.add_circle((0, 0), 2.7)
    nut.add_attdef("PART", (0, 0))
    bracket = doc.blocks.new("BRACKET")
    bracket.add_lwpolyline([(0, 0), (60, 0), (60, 25), (25, 25), (25, 40), (0, 40)], close=True)
    for x, y in [(10, 10), (50, 12)]:
        ref = bracket.add_blockref("PEM_NUT_M4", (x, y))
        ref.add_auto_attribs({"PART": "CLS-M4-1"})
    msp.add_blockref("BRACKET", (10, 10), dxfattribs={
        "column_count": 3, "row_count": 2, "column_spacing": 70, "row_spacing": 50,
    })
    return doc, {}


SAMPLES = [
    ("plate", "Mounting plate", "mounting-plate.dxf", mounting_plate,
     "Rounded corners as polyline bulges, six round holes, and a slot drawn as four loose entities."),
    ("messy", "Messy export", "messy-export.dxf", messy_export,
     "A doubled line, a text, dimensions, a title frame (excluded with exclude_layers=FRAME) and a 0.5 mm gap."),
    ("sheet", "Blocks & BOM", "nested-sheet.dxf", nested_sheet,
     "A MINSERT array of a bracket block with nested press-in nut blocks and attributes."),
]

KEEP = [
    "total_cut_length_mm", "pierce_count", "closed_loop_count", "open_contour_count", "part_count",
    "hole_count", "net_area_mm2", "duplicate_length_removed",
]


def main() -> None:
    OUT_FILES.mkdir(parents=True, exist_ok=True)
    OUT_DATA.parent.mkdir(parents=True, exist_ok=True)
    demos = []
    for sid, title, file, build, blurb in SAMPLES:
        doc, options = build()
        data = to_bytes(doc)
        (OUT_FILES / file).write_bytes(data)
        result = analyze_dxf_bytes(data, generate_svg=True, **options)
        svg = result.get("svg_preview", "")
        shown = dict(result)
        shown["svg_preview"] = "<svg …> (shown above)" if svg else ""
        query = "&".join(f"{k}={','.join(v)}" for k, v in options.items())
        demos.append({
            "id": sid,
            "title": title,
            "blurb": blurb,
            "file": file,
            "size": len(data),
            "query": query,
            "svg": svg,
            "result": {k: result.get(k) for k in KEEP},
            "bbox": result.get("bounding_box_mm") or result.get("bounding_box"),
            "bom": result.get("bom_blocks", []),
            "warnings": result.get("warnings", []),
            "ignored": result.get("ignored_entities"),
            "json": json.dumps(shown, indent=2, ensure_ascii=False),
        })
        print(f"{file:22} cut {result.get('total_cut_length_mm')} mm, pierces {result.get('pierce_count')}, "
              f"parts {result.get('part_count')}, holes {result.get('hole_count')}, warnings {len(result.get('warnings', []))}")
    OUT_DATA.write_text(json.dumps(demos, indent=1, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
