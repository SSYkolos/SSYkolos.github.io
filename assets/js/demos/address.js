/* Live demo: structured address split of the SEPA & NACHA Payment File API (registers with /assets/js/live-demo.js). */
(function () {
  "use strict";
  if (!window.KHDemo) return;

  // API field -> ISO 20022 element, in the order of the schema.
  var FIELDS = [["street", "StrtNm", "Street"], ["building_number", "BldgNb", "Building number"],
    ["post_box", "PstBx", "Post box"], ["postal_code", "PstCd", "Postal code"], ["town", "TwnNm", "Town"],
    ["country_subdivision", "CtrySubDvsn", "Region"], ["country", "Ctry", "Country"]];
  var FORM = { structured: "STRUCTURED", hybrid: "HYBRID", unresolved: "REVIEW" };

  KHDemo.register("address", {
    working: "Finding the postal code, town, street and number with the country's rules.",
    next: "The full API also fixes every payer and payee address of a pain.001 / pain.008 file in place, and cleans a whole vendor list as CSV.",
    fileNote: "Addresses can belong to real people.",
    tooLarge: "One address at a time here. The API cleans whole CSV lists.",

    help: {
      INVALID_REQUEST: ["The address could not be read", "Type one address, its parts separated by commas or line breaks, and a two-letter country code if the address does not end with the country."]
    },

    render: function (body, file, u) {
      var el = u.el, a = body.address || {}, d = body.demo || {};
      var verdict = u.verdict(FORM[body.form] || "REVIEW");
      var detail = ["confidence " + body.confidence, d.processing_ms != null ? d.processing_ms + " ms" : null]
        .filter(Boolean).join(" · ");
      var out = [el("div", { class: "live__summary" }, [el("p", { class: "demo__overall" }, [verdict, el("span", { text: detail })])])];

      var rows = FIELDS.filter(function (f) { return a[f[0]]; }).map(function (f) {
        return el("tr", null, [el("td", { text: f[2] }), el("td", null, [el("code", { text: "<" + f[1] + ">" })]), el("td", { text: a[f[0]] })]);
      });
      (a.lines || []).forEach(function (line) {
        rows.push(el("tr", null, [el("td", { text: "Address line" }), el("td", null, [el("code", { text: "<AdrLine>" })]), el("td", { text: line })]));
      });
      if (rows.length) {
        out.push(el("p", { class: "demo__label", text: "ISO 20022 postal address" }));
        out.push(el("div", { class: "demo__table" }, [el("table", null, [
          el("thead", null, [el("tr", null, [el("th", { text: "Field" }), el("th", { text: "Element" }), el("th", { text: "Value" })])]),
          el("tbody", null, rows)
        ])]));
      }
      var notes = body.notes || [];
      if (body.needs_review) {
        out.push(el("p", { text: "Not split: " + (notes[notes.length - 1] || "the address is not clear enough.") + " In file mode this address is left as it is and listed for manual review." }));
      } else if (notes.length) {
        out.push(el("p", { class: "live__fineprint", text: notes.join(" ") }));
      }
      out.push(u.jsonDetails(body, "POST /v1/addresses/parse"));
      return out;
    }
  });
})();
