// Lets the embedded demo set its own height, as the widget's embed.js does on a shop's site.
(function () {
  var f = document.getElementById("lq-demo");
  if (!f) return;
  window.addEventListener("message", function (e) {
    if (e.origin === "https://quote.ssydynamics.dev" && e.source === f.contentWindow && e.data && e.data.lqHeight) {
      f.style.height = Math.ceil(e.data.lqHeight) + "px";
    }
  });
})();
