// Progressive enhancement only. The page is complete without this file.
// 1. Reveal sections and step visuals as they scroll into view (respects reduced motion via CSS).
(function () {
  var targets = document.querySelectorAll("[data-reveal], .step");
  if (!("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  targets.forEach(function (el) { observer.observe(el); });
})();
