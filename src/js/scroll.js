// One requestAnimationFrame reader for everything scroll-linked. Each frame does all reads first
// (getBoundingClientRect) and then all writes (CSS custom properties, classes), so there is no layout
// thrash. Work stops while nothing scroll-linked is on screen.
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

export function initScroll({ story }) {
  const storyEl = document.querySelector(".story");
  const hero = storyEl.querySelector(".hero-block");
  const wrap = storyEl.querySelector(".stage-wrap");
  const steps = [...storyEl.querySelectorAll(".step")];
  const dockLinks = [...storyEl.querySelectorAll(".dock a")];
  const nav = document.querySelector(".nav");
  const navInner = nav.querySelector(".nav-inner");
  const dock = storyEl.querySelector(".dock");
  const flow = document.querySelector(".flow");
  const toneSections = [...document.querySelectorAll("main > [data-tone]")];
  const desktop = matchMedia("(min-width: 960px)");
  const chapters = [1, 2, 3].map((c) => steps.filter((s) => Number(s.dataset.chapter) === c));

  let queued = false;
  const last = { dark: -1, active: -1, tone: "", flowIn: -1, flowOut: -1, light: -1, chapter: -1, cps: "" };

  function frame() {
    queued = false;
    const vh = innerHeight;
    const isDesktop = desktop.matches;

    // ---------- reads ----------
    const heroRect = hero.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const stepRects = steps.map((s) => s.getBoundingClientRect());
    const flowRect = flow ? flow.getBoundingClientRect() : null;
    const toneRects = toneSections.map((s) => s.getBoundingClientRect());
    const docMax = Math.max(1, document.documentElement.scrollHeight - vh);
    const scrollFrac = clamp(scrollY / docMax);

    // Daylight to graphite: desktop follows the hero leaving; phones follow the stage pinning.
    const dark = isDesktop
      ? clamp((vh * 0.9 - heroRect.bottom) / (vh * 0.5))
      : clamp(1 - wrapRect.top / (vh * 0.22));

    // Active frame: the last step whose text centre has crossed the reading line.
    // Desktop: a step's centre crosses 60% of the viewport. Phones: its heading has risen a third of the
    // way into the reading band under the pinned stage.
    const line = isDesktop ? vh * 0.6 : vh - (vh - wrapRect.bottom) * 0.34;
    let active = 0;
    stepRects.forEach((r, i) => { if ((isDesktop ? r.top + Math.min(r.height, vh) * 0.5 : r.top) < line) active = i + 1; });
    // On phones the story only starts once the stage has pinned under the nav.
    if (!isDesktop && wrapRect.top > 1) active = 0;

    // Chapter progress for the dock: 0..1 across each chapter's steps.
    const cps = chapters.map((list) => {
      if (!list.length) return 0;
      const first = stepRects[steps.indexOf(list[0])];
      const lastR = stepRects[steps.indexOf(list[list.length - 1])];
      const start = first.top + first.height * 0.2;
      const end = lastR.top + lastR.height * 0.6;
      return clamp((line - start) / Math.max(1, end - start));
    });
    const chapter = active ? Number(steps[active - 1].dataset.chapter) : 0;

    // Nav tone: whatever section sits under the nav's centre line.
    const navLine = 40;
    let tone = "light";
    toneRects.forEach((r, i) => {
      if (r.top <= navLine && r.bottom > navLine) {
        const t = toneSections[i].dataset.tone;
        tone = t === "story" ? (dark >= 0.5 ? "dark" : "light") : t;
      }
    });

    // "One front office": inbound paths draw first, then the outputs.
    let flowIn = last.flowIn, flowOut = last.flowOut;
    if (flowRect && flowRect.bottom > 0 && flowRect.top < vh) {
      const p = clamp((vh * 0.9 - flowRect.top) / (flowRect.height * 0.9 + vh * 0.25));
      flowIn = clamp(p / 0.55);
      flowOut = clamp((p - 0.55) / 0.35);
    }

    // The glass light source drifts with the page (a few degrees per screen).
    const light = Math.round(290 + scrollFrac * 60);

    // ---------- writes ----------
    if (Math.abs(dark - last.dark) > 0.002) {
      storyEl.style.setProperty("--dark", dark.toFixed(3));
      // Story copy switches from ink to white at the midpoint, so it never sits at low contrast for long.
      storyEl.classList.toggle("is-dark", dark >= 0.5);
      last.dark = dark;
    }
    if (active !== last.active) {
      storyEl.classList.toggle("is-storying", active > 0);
      steps.forEach((s, i) => s.classList.toggle("is-active", i === active - 1));
      story.go(active);
      last.active = active;
    }
    if (chapter !== last.chapter) {
      dockLinks.forEach((a) => {
        if (Number(a.dataset.chapter) === chapter) a.setAttribute("aria-current", "step");
        else a.removeAttribute("aria-current");
      });
      last.chapter = chapter;
    }
    const cpsKey = cps.map((v) => v.toFixed(3)).join();
    if (cpsKey !== last.cps) {
      dockLinks.forEach((a, i) => a.style.setProperty("--cp", cps[i].toFixed(3)));
      last.cps = cpsKey;
    }
    if (tone !== last.tone) { nav.dataset.tone = tone; last.tone = tone; }
    if (flow && (flowIn !== last.flowIn || flowOut !== last.flowOut)) {
      flow.style.setProperty("--p-in", flowIn.toFixed(3));
      flow.style.setProperty("--p-out", flowOut.toFixed(3));
      last.flowIn = flowIn; last.flowOut = flowOut;
    }
    if (light !== last.light) {
      navInner.style.setProperty("--light", `${light}deg`);
      dock.style.setProperty("--light", `${light + 10}deg`);
      last.light = light;
    }
  }

  const request = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", request, { passive: true });
  desktop.addEventListener?.("change", request);
  if (flow) { flow.style.setProperty("--p-in", "0"); flow.style.setProperty("--p-out", "0"); }
  frame();
  return { refresh: request };
}
