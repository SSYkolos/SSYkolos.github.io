/* Live demo: CAD DXF Quote API (registers with /assets/js/live-demo.js). */
(function () {
  "use strict";
  if (!window.KHDemo) return;

  KHDemo.register("dxf-quote-api", {
    working: "Reading the drawing and measuring every contour.",
    next: "The full API accepts drawings up to 25 MB and can return every contour with its role, length and area.",
    fileNote: "Drawings can contain names or part numbers in their texts.",
    tooLarge: "Try a single part instead of a full sheet. The API itself accepts 25 MB.",

    precheck: function (file, head, u) {
      var e = u.ext(file.name);
      if (u.startsWith(head, "%PDF")) {
        return u.problem("This is a PDF", "The API reads DXF drawings. Most CAD programs can export a DXF via 'Save as' or 'Export'.");
      }
      // A DWG starts with its version tag ("AC1032" ...); an ASCII or binary DXF never does.
      if (e === "dwg" || u.startsWith(head, "AC10")) {
        return u.problem("This is a DWG file",
          "DWG is AutoCAD's closed format, so the API reads DXF instead. Exporting is quick: " +
          "AutoCAD: Save As, then choose DXF. SolidWorks: File, Save As, .dxf. Fusion 360: right-click the sketch, Save as DXF. " +
          "Inkscape and LibreCAD can save DXF directly.");
      }
      if (["step", "stp", "stl", "iges", "igs", "svg", "png", "jpg", "jpeg"].indexOf(e) >= 0) {
        return u.problem("This is not a DXF drawing", "The API reads 2D DXF files. Export the flat pattern or sketch as DXF and try again.");
      }
      return null;
    },

    help: {
      UNSUPPORTED_FORMAT: ["This is not a DXF drawing",
        "The API reads DXF (ASCII or binary). DWG files need to be exported as DXF first: in most CAD programs that is 'Save As' or 'Export'."],
      MALFORMED_DXF: ["This drawing could not be read",
        "The file is damaged or not a complete DXF. If your CAD program produced it unchanged, we'd like to see it: " +
        "every file like this makes the parser better."],
      TOO_COMPLEX: ["This drawing is too complex for one request",
        "It has more geometry than the API processes in a single call. Try a single part or a smaller sheet."]
    },

    render: function (body, file, u) {
      var el = u.el, d = body.demo || {}, bb = body.bounding_box_mm || {};
      var out = [u.summary(el("span", { class: "verdict", text: "ANALYSED" }),
        (body.unit_name || "") + (d.processing_ms != null ? " · " + d.processing_ms + " ms" : ""), file)];
      var preview = el("div", { class: "demo__svg", role: "img", "aria-label": "Preview of the cut geometry" });
      var svg = u.safeSvg(body.svg_preview);
      preview.appendChild(svg || el("p", { class: "live__fineprint", text: "No preview for this drawing." }));
      var dl = el("dl", { class: "mini mini--plain" }, [
        u.miniRow("Cut length", body.total_cut_length_mm + " mm", "mini__sum"),
        u.miniRow("Pierces", String(body.pierce_count)),
        u.miniRow("Parts / holes", body.part_count + " / " + body.hole_count),
        u.miniRow("Net area", (body.net_area_mm2 != null ? body.net_area_mm2 : "–") + " mm²"),
        u.miniRow("Bounding box", (bb.width != null ? bb.width + " × " + bb.height + " mm" : "–")),
        u.miniRow("Closed / open contours", body.closed_loop_count + " / " + body.open_contour_count)
      ]);
      if (body.duplicate_length_removed > 0) dl.appendChild(u.miniRow("Duplicate length removed", body.duplicate_length_removed + " (drawing units)"));
      var ign = body.ignored_entities || {};
      if (ign.filtered_by_layer_option) dl.appendChild(u.miniRow("Excluded by layer filter", String(ign.filtered_by_layer_option)));
      if (ign.on_disabled_layers) dl.appendChild(u.miniRow("On hidden or frozen layers", String(ign.on_disabled_layers)));
      Object.keys(ign.not_cut_geometry || {}).forEach(function (k) { dl.appendChild(u.miniRow("Ignored " + k, String(ign.not_cut_geometry[k]))); });
      var side = el("div", { class: "demo__col" }, [el("p", { class: "demo__label", text: "Result" }), dl]);
      (body.warnings || []).forEach(function (w) { side.appendChild(el("p", { class: "demo__warning", text: w })); });
      out.push(el("div", { class: "demo__split" }, [
        el("div", { class: "demo__col" }, [el("p", { class: "demo__label", text: "svg_preview" }), preview]), side
      ]));
      if ((body.bom_blocks || []).length) {
        out.push(el("p", { class: "demo__label", text: "bom_blocks" }));
        out.push(el("div", { class: "demo__table" }, [el("table", null, [
          el("thead", null, [el("tr", null, [el("th", { text: "Block" }), el("th", { class: "num", text: "Quantity" }),
            el("th", { text: "Layer" }), el("th", { text: "Attributes" })])]),
          el("tbody", null, body.bom_blocks.map(function (b) {
            var attrs = Object.keys(b.sample_attributes || {}).map(function (k) { return k + " = " + b.sample_attributes[k]; }).join(", ");
            return el("tr", null, [el("td", { text: b.block_name }), el("td", { class: "num", text: String(b.quantity) }),
              el("td", { text: b.layer || "–" }), el("td", { text: attrs || "–" })]);
          }))
        ])]));
      }
      var shown = JSON.parse(JSON.stringify(body));
      if (shown.svg_preview) shown.svg_preview = "<svg …> (shown above)";
      out.push(u.jsonDetails(shown, "POST /demo/analyze-dxf"));
      return out;
    }
  });
})();
