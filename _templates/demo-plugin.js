/* Live demo: __TITLE__ (registers with /assets/js/live-demo.js). Examples: the other files in this folder. */
(function () {
  "use strict";
  if (!window.KHDemo) return;

  KHDemo.register("__SLUG__", {
    working: "Processing the file.",                       // shown while waiting
    next: "The full API also ...",                          // shown under a result
    fileNote: "",                                           // what the file may contain, next to "also send the file"
    tooLarge: "The API itself accepts larger files.",

    // Checks in the browser before uploading. Return u.problem(title, text) to stop, or null.
    precheck: function (file, head, u) {
      return null;
    },

    // The API's error codes in plain words: CODE: [title, text]. Common ones are already handled.
    help: {
      UNSUPPORTED_FORMAT: ["This file type is not supported", "The API reads ..."]
    },

    // Turn the API's JSON answer into page elements (u.el creates them; never insert server text as HTML).
    render: function (body, file, u) {
      return [
        u.summary(u.el("span", { class: "verdict", text: "DONE" }), "", file),
        u.jsonDetails(body, "POST /demo/...")
      ];
    }
  });
})();
