/*
  Search and area filter for the product list. Without JavaScript the full, grouped list shows.
  Nothing is stored or sent anywhere.
*/
(function () {
  "use strict";
  var box = document.querySelector(".filter");
  if (!box) return;
  var input = box.querySelector(".filter__input");
  var chips = box.querySelectorAll(".chip-btn");
  var count = box.querySelector(".filter__count");
  var groups = document.querySelectorAll(".pgroup");
  var empty = document.querySelector(".filter__empty");
  var cards = box.parentNode.querySelectorAll(".card");
  var area = "";

  function apply() {
    var words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    var shown = 0;
    Array.prototype.forEach.call(cards, function (card) {
      var hay = card.getAttribute("data-search") || "";
      var ok = (!area || card.getAttribute("data-category") === area) &&
        words.every(function (w) { return hay.indexOf(w) >= 0; });
      card.hidden = !ok;
      if (ok) shown += 1;
    });
    Array.prototype.forEach.call(groups, function (g) {
      g.hidden = !g.querySelector(".card:not([hidden])");
    });
    empty.hidden = shown > 0;
    count.textContent = (words.length || area) ? shown + " of " + cards.length + " shown" : "";
  }

  Array.prototype.forEach.call(chips, function (chip) {
    chip.addEventListener("click", function () {
      area = chip.getAttribute("data-cat");
      Array.prototype.forEach.call(chips, function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
      apply();
    });
  });
  input.addEventListener("input", apply);

  var q = new URLSearchParams(location.search).get("q");
  if (q) input.value = q;
  box.hidden = false;
  apply();
})();
