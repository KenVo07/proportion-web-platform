// Section reveals: each [data-reveal] element settles in once as it enters the viewport.
// CSS hides them only while .js is set and they have not been revealed yet.
export function initReveal() {
  const targets = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) { targets.forEach((el) => el.classList.add("is-in")); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
  targets.forEach((el) => io.observe(el));
}
