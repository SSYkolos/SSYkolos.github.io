// Home page stepper: shows the laser slide, moves once to the main hero, then stays there unless the visitor steps back.
(function () {
  var root = document.querySelector("[data-hs]");
  if (!root) return;
  var slides = root.querySelectorAll(".hs__slide");
  var steps = root.querySelectorAll(".hs__step");
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if ((navigator.language || "").slice(0, 2).toLowerCase() === "hu") {
    root.classList.add("hs--hu");
    root.querySelectorAll("[data-hu-href]").forEach(function (a) { a.href = a.dataset.huHref; });
    steps.forEach(function (b) { b.querySelector("span").textContent = b.dataset.hu; });
  }

  function go(step) {
    slides.forEach(function (s) {
      var on = s.dataset.step === String(step);
      s.classList.toggle("is-on", on);
      s.inert = !on;
    });
    steps.forEach(function (b) {
      if (b.dataset.go === String(step)) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
    root.dataset.current = step;
  }
  function stopAuto() { root.classList.remove("is-playing"); }

  root.classList.add("hs--js");
  go(1);
  if (!calm) root.classList.add("is-playing");

  steps.forEach(function (b) {
    b.addEventListener("click", function () { stopAuto(); go(b.dataset.go); });
  });
  // The progress line is the timer, so pausing it pauses the move too.
  steps[0].querySelector("i").addEventListener("animationend", function () {
    if (root.classList.contains("is-playing")) { stopAuto(); go(2); }
  });

  var stage = root.querySelector(".hs__stage");
  function pause() { root.classList.add("is-paused"); }
  function resume() { root.classList.remove("is-paused"); }
  stage.addEventListener("mouseenter", pause);
  stage.addEventListener("mouseleave", resume);
  root.addEventListener("focusin", pause);
  root.addEventListener("focusout", resume);

  root.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { stopAuto(); go(e.key === "ArrowRight" ? 2 : 1); }
  });
  var startX = null;
  stage.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) { stopAuto(); go(dx < 0 ? 2 : 1); }
  }, { passive: true });
})();
