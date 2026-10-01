// Progressive enhancement entry point. The page is complete without JavaScript: copy is static HTML
// and the stage shows its hero frame. With JavaScript the stage is pinned and plays the story.
import { initDates } from "./dates.js";
import { initStory } from "./story.js";
import { initScroll } from "./scroll.js";
import { initReveal } from "./reveal.js";
import { initFunnel } from "./funnel.js";

initFunnel("landing");

const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

// Without container query units the stage cannot be laid out (CSS hides it); keep the static page.
if (!CSS.supports("width: 1cqw")) {
  root.classList.remove("js");
  throw new Error("AFO: container query units unsupported; using the static page.");
}

initDates();
const story = initStory({ reduceMotion });
story.intro();
initScroll({ story });
initReveal();
root.classList.add("motion-ready");
