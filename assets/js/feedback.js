/*
  Feedback: the "Send this to the developer" form in the live demos, and the contact form.
  Reports go to the feedback collector (see the privacy page). No cookies, no storage, no third parties.
  Everything from the server or the visitor is inserted as text, never as HTML.
*/
(function () {
  "use strict";

  var UI_VERSION = "1";

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") node.textContent = v;
      else if (k === "class") node.className = v;
      else node.setAttribute(k, v === true ? "" : v);
    });
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }
  function fmtBytes(n) {
    if (n < 1024) return n + " bytes";
    if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
    return (n / 1048576).toFixed(1) + " MB";
  }
  var uid = 0;
  function nextId(prefix) { uid += 1; return prefix + "-" + uid; }

  var ERRORS = {
    RATE_LIMITED: "You have sent several messages today already, thank you! Please try again tomorrow.",
    BUSY: "Too many messages arrived today. Please try again tomorrow.",
    MESSAGE_REQUIRED: "Please write a few words.",
    INVALID_EMAIL: "This e-mail address does not look right. You can also leave it empty.",
    FILE_TOO_LARGE: "The file is larger than 5 MB. Please send the report without it.",
    CONSENT_REQUIRED: "Please tick the box to send the file, or untick it."
  };

  function post(endpoint, form) {
    return fetch(endpoint, {
      method: "POST", body: form, credentials: "omit", cache: "no-store", headers: { Accept: "application/json" }
    }).then(function (resp) {
      return resp.json().catch(function () { return {}; }).then(function (body) {
        if (resp.ok) return body;
        var err = (body && body.error) || {};
        throw { code: err.code, message: ERRORS[err.code] || err.message || ("The server answered with status " + resp.status + ".") };
      });
    }, function () {
      throw { code: "NETWORK", message: "Could not reach the server. Please check your connection and try again." };
    });
  }

  function honeypot() {
    // Hidden from people and screen readers; bots fill it in.
    return el("div", { class: "fb__hp", "aria-hidden": "true" }, [
      el("label", null, ["Website", el("input", { type: "text", name: "website", tabindex: "-1", autocomplete: "off" })])
    ]);
  }

  function thanks(id, extra) {
    return el("div", { class: "fb__thanks", role: "status" }, [
      el("p", { class: "fb__thanks-title", text: "Thank you, it arrived." }),
      el("p", { text: "We read every report ourselves" + (extra || "") + "." }),
      el("p", { class: "fb__ref", text: "Reference: " + id })
    ]);
  }

  // ---------------------------------------------------------------- report form for the live demos
  /*
    opts: endpoint, product, kind ("bug" | "wrong_result"), context (object), file (File or null),
          fileNote (what the file contains), title
  */
  function reportForm(opts) {
    var formId = nextId("fb");
    var box = el("div", { class: "fb fb--report" });
    var form = el("form", { class: "fb__form", novalidate: true });
    var msgId = formId + "-msg", mailId = formId + "-mail", fileId = formId + "-file";

    form.appendChild(el("p", { class: "fb__title", text: opts.title || "Send this to the developer" }));
    form.appendChild(el("p", { class: "fb__lead", text: opts.kind === "wrong_result"
      ? "Tell us what looks wrong. The result details are attached automatically, so a few words are enough."
      : "The error details are attached automatically. Reports like this are how new file variants get supported." }));

    form.appendChild(el("label", { class: "fb__label", for: msgId, text: "Anything we should know? (optional)" }));
    form.appendChild(el("textarea", { id: msgId, name: "message", rows: "3", maxlength: "4000",
      placeholder: opts.kind === "wrong_result" ? "e.g. the closing balance should be 1,240.50" : "e.g. which bank or CAD program produced the file" }));

    var fileBox = null;
    if (opts.file) {
      fileBox = el("input", { type: "checkbox", id: fileId, name: "file_consent", value: "yes" });
      form.appendChild(el("div", { class: "fb__consent" }, [
        el("label", { class: "option", for: fileId }, [fileBox, el("span", null, [
          el("b", { text: "Also send the file itself" }), " (" + opts.file.name + ", " + fmtBytes(opts.file.size) + "). ",
          opts.fileNote || ""
        ])]),
        el("p", { class: "fb__fine", text: "It is stored privately in the EU, only we can open it, and it is deleted automatically after 30 days. " +
          "If it becomes a test case, it is anonymised first. Without the file we can still see the error, but usually cannot fix it." })
      ]));
    }

    form.appendChild(el("label", { class: "fb__label", for: mailId, text: "Your e-mail (optional, only if you would like an answer)" }));
    form.appendChild(el("input", { type: "email", id: mailId, name: "email", maxlength: "254", autocomplete: "email", placeholder: "you@company.com" }));
    form.appendChild(honeypot());

    var sent = el("details", { class: "fb__sent" }, [el("summary", { text: "What will be sent" })]);
    var list = el("dl", { class: "fb__sent-list" });
    Object.keys(opts.context).forEach(function (k) {
      var v = opts.context[k];
      if (v === null || v === undefined || v === "") return;
      list.appendChild(el("div", null, [el("dt", { text: k }), el("dd", { text: String(v) })]));
    });
    list.appendChild(el("div", null, [el("dt", { text: "file" }), el("dd", { text: opts.file ? "only if the box above is ticked" : "none" })]));
    sent.appendChild(list);
    sent.appendChild(el("p", { class: "fb__fine", text: "Plus your words and e-mail, if you give them. No cookies, no tracking." }));
    form.appendChild(sent);

    var status = el("p", { class: "fb__status", role: "status", "aria-live": "polite" });
    var submit = el("button", { type: "submit", class: "btn btn--primary", text: "Send report" });
    form.appendChild(el("div", { class: "fb__actions" }, [submit, status]));

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData();
      data.append("kind", opts.kind);
      data.append("product", opts.product);
      data.append("message", form.elements.message.value);
      data.append("email", form.elements.email.value.trim());
      data.append("website", form.elements.website.value);
      var ctx = {};
      Object.keys(opts.context).forEach(function (k) { ctx[k] = opts.context[k]; });
      ctx.ui_version = UI_VERSION;
      data.append("context", JSON.stringify(ctx));
      if (fileBox && fileBox.checked) {
        data.append("file_consent", "yes");
        data.append("file", opts.file, opts.file.name);
      }
      submit.disabled = true;
      status.className = "fb__status";
      status.textContent = "Sending…";
      post(opts.endpoint, data).then(function (body) {
        box.replaceChild(thanks(body.id, form.elements.email.value.trim() ? " and answer when we can" : ""), form);
      }, function (err) {
        submit.disabled = false;
        status.className = "fb__status fb__status--error";
        status.textContent = err.message;
      });
    });

    box.appendChild(form);
    return box;
  }

  // A small button that opens the report form in place.
  function reportButton(opts) {
    var wrap = el("div", { class: "fb-open" });
    var btn = el("button", { type: "button", class: "btn btn--ghost", text: opts.buttonText || "Send this to the developer" });
    btn.addEventListener("click", function () {
      var f = reportForm(opts);
      wrap.replaceChild(f, btn);
      var first = f.querySelector("textarea");
      if (first) first.focus();
    });
    wrap.appendChild(btn);
    return wrap;
  }

  window.KHFeedback = { reportForm: reportForm, reportButton: reportButton };

  // ---------------------------------------------------------------- contact form (works without JS too)
  Array.prototype.forEach.call(document.querySelectorAll("form.contact-form"), function (form) {
    var kindInputs = form.querySelectorAll('input[name="kind"]');
    var praiseOnly = form.querySelectorAll(".contact-form__praise");
    var status = form.querySelector(".fb__status");
    var submit = form.querySelector('button[type="submit"]');
    var params = new URLSearchParams(location.search);

    var product = params.get("product");
    if (product && form.elements.product) {
      Array.prototype.forEach.call(form.elements.product.options, function (o) { if (o.value === product) o.selected = true; });
    }
    function syncKind() {
      var k = form.querySelector('input[name="kind"]:checked');
      Array.prototype.forEach.call(praiseOnly, function (n) { n.hidden = !(k && k.value === "praise"); });
    }
    Array.prototype.forEach.call(kindInputs, function (i) { i.addEventListener("change", syncKind); });
    syncKind();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      data.set("context", JSON.stringify({ source: "contact", page: location.pathname, ui_version: UI_VERSION }));
      submit.disabled = true;
      status.className = "fb__status";
      status.textContent = "Sending…";
      post(form.getAttribute("action"), data).then(function (body) {
        var box = thanks(body.id, (form.elements.email.value.trim() ? " and answer when we can" : ""));
        form.parentNode.replaceChild(box, form);
        box.setAttribute("tabindex", "-1");
        box.focus();
      }, function (err) {
        submit.disabled = false;
        status.className = "fb__status fb__status--error";
        status.textContent = err.message;
      });
    });
  });
})();
