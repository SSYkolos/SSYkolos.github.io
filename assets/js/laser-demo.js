// Lets each embedded calculator set its own height, as the widget's embed.js does on a shop's site.
(function () {
  var frames = document.querySelectorAll(".lq-frame");
  window.addEventListener("message", function (e) {
    frames.forEach(function (f) {
      if (e.origin === f.dataset.origin && e.source === f.contentWindow && e.data && e.data.lqHeight) {
        f.style.height = Math.ceil(e.data.lqHeight) + "px";
      }
    });
  });
})();
