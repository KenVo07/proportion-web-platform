// The product stage. Eight frames (0 hero … 7 takeover). Moving forward one frame plays that frame's
// choreography on a clock; moving backwards or skipping settles instantly. Layout per frame is pure CSS
// (06-stage.css keys off data-state); this module only switches content inside the surfaces.

// What each frame adds and removes, cumulatively. Keys match [data-k] in the markup.
// "slot-x:status" sets a calendar slot; swap groups (SWAPS) crossfade text states in a fixed box.
const ADD = [
  ["m1", "m2", "tok-happening", "f-happening", "n-escaping", "n-suburb", "n-exposed", "L1"],
  ["m3", "m4", "m5", "note-safety"],
  ["tok-escaping", "tok-suburb", "tok-exposed", "f-escaping", "f-suburb", "f-exposed", "n-none"],
  ["busy", "slot-a:offered", "slot-b:offered", "slot-c:offered", "slot-d:offered", "L4", "m6"],
  ["m7", "L5", "L6", "L7", "booked-blk", "booked-tag", "m8", "slot-a:gone", "slot-b:gone", "slot-c:gone", "slot-d:gone"],
  ["m9", "m10", "A0", "sheet", "A1"],
  ["m11", "toast", "A2", "B5"],
  ["m12", "m13", "A3"],
  [],
];
const REMOVE = [[], [], ["note-safety", "n-escaping", "n-suburb", "n-exposed"], [], [], [], [], ["sheet", "toast"], []];
const SWAPS = [
  { "chat-sub": "ai", "case-sub": "new", "case-stage": "conv", appt: "none", quote: "none", handling: "ai", "quote-status": "wait", "sheet-actions": "actions" },
  { quote: "safety" },
  { "case-sub": "suburb", "case-stage": "qual", quote: "none" },
  {},
  { "case-stage": "booked", appt: "booked" },
  {},
  { "quote-status": "sent", "sheet-actions": "result" },
  { handling: "human", "chat-sub": "team" },
  {},
];

// Choreography for arriving at frame n from n-1: [ms, action]. Actions: "key" (on), "-key" (off),
// "typing:key", "fly:fact", "swap:group=value", "slot-x:status", "press:key", "scan", "layers".
const SEQUENCES = [
  [[300, "L1"], [300, "n-escaping"], [300, "n-suburb"], [300, "n-exposed"], [450, "m1"], [900, "typing:m2"], [1500, "m2"], [1850, "tok-happening"], [2000, "fly:happening"]],
  [[250, "m3"], [650, "typing:m4"], [1250, "m4"], [1250, "note-safety"], [1300, "swap:quote=safety"], [2050, "m5"]],
  [[0, "-note-safety"], [760, "tok-escaping"], [860, "fly:escaping"], [1000, "tok-suburb"], [1100, "fly:suburb"], [1240, "tok-exposed"], [1340, "fly:exposed"],
    [1800, "-n-escaping"], [2040, "-n-suburb"], [2280, "-n-exposed"], [2000, "swap:case-sub=suburb"], [2000, "swap:case-stage=qual"], [2100, "swap:quote=none"], [2500, "n-none"]],
  [[480, "busy"], [700, "scan"], [1350, "slot-a:offered"], [1470, "slot-b:offered"], [1590, "slot-c:offered"], [1710, "slot-d:offered"], [1800, "L4"],
    [1950, "typing:m6"], [2550, "m6"]],
  [[250, "m7"], [1150, "slot-a:chosen"], [1150, "L5"], [1450, "slot-b:gone"], [1450, "slot-c:gone"], [1450, "slot-d:gone"],
    [1750, "slot-a:requested"], [1750, "L6"], [1750, "swap:case-stage=booking"], [2550, "booked-blk"], [2550, "L7"], [2550, "swap:case-stage=booked"],
    [2700, "swap:appt=booked"], [2750, "slot-a:gone"], [2800, "booked-tag"], [3050, "typing:m8"], [3650, "m8"]],
  [[350, "m9"], [700, "A0"], [950, "typing:m10"], [1450, "m10"], [1500, "sheet"], [1750, "A1"]],
  [[350, "press:approve-press"], [620, "swap:quote-status=sent"], [620, "swap:sheet-actions=result"], [900, "m11"], [950, "toast"], [1000, "A2"]],
  [[0, "-sheet"], [0, "-toast"], [420, "swap:handling=human"], [620, "swap:chat-sub=team"], [820, "m12"], [1000, "A3"], [1400, "m13"]],
  [],
];
const INTRO_START = { layers: 120 };

export function initStory({ reduceMotion }) {
  const stage = document.querySelector(".stage");
  if (!stage) return { go() {} };
  const byKey = new Map();
  for (const el of stage.querySelectorAll("[data-k]")) {
    const k = el.dataset.k;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(el);
  }
  const sheet = stage.querySelector(".c-sheet");
  byKey.set("sheet", [sheet]);
  const slots = {};
  for (const el of stage.querySelectorAll("[data-slot]")) (slots[el.dataset.slot] ||= []).push(el);
  const swaps = Object.fromEntries([...stage.querySelectorAll("[data-swap]")].map((el) => [el.dataset.swap, el]));
  const chat = stage.querySelector(".c-chat");
  const chatView = chat.querySelector(".chat-view");
  const chatList = chat.querySelector(".chat-list");
  const logList = stage.querySelector(".log-list");

  let current = null;
  let timers = [];
  const reduced = () => reduceMotion.matches;

  // ---------- Content primitives ----------
  const setOn = (key, on) => {
    for (const el of byKey.get(key) || []) {
      el.classList.toggle("on", on);
      if (!on) el.classList.remove("typing");
    }
  };
  const setSlot = (id, status) => {
    for (const el of slots[id] || []) {
      if (status) el.dataset.status = status;
      else delete el.dataset.status;
    }
  };
  const setSwap = (group, value) => {
    const el = swaps[group];
    if (!el) return;
    for (const child of el.children) child.classList.toggle("on", child.dataset.v === value);
  };
  const apply = (token, on = true) => {
    const slot = token.match(/^slot-([a-d]):(\w+)$/);
    if (slot) return setSlot(slot[1], on ? slot[2] : null);
    setOn(token, on);
  };

  // The final frame n, built from ADD/REMOVE/SWAPS so every path lands on the same picture.
  function frame(n) {
    const on = new Set();
    const slotState = {};
    const swapState = { ...SWAPS[0] };
    for (let i = 0; i <= n; i++) {
      for (const t of ADD[i]) {
        const s = t.match(/^slot-([a-d]):(\w+)$/);
        if (s) slotState[s[1]] = s[2];
        else on.add(t);
      }
      for (const t of REMOVE[i]) on.delete(t);
      Object.assign(swapState, SWAPS[i]);
    }
    return { on, slotState, swapState };
  }
  function settle(n) {
    clearTimers();
    for (const g of stage.querySelectorAll(".fact-ghost")) g.remove();
    loadReal(n);
    const { on, slotState, swapState } = frame(n);
    for (const key of byKey.keys()) setOn(key, on.has(key));
    for (const id of Object.keys(slots)) setSlot(id, slotState[id] || null);
    for (const [g, v] of Object.entries(swapState)) setSwap(g, v);
    for (const b of stage.querySelectorAll(".ui-btn.on")) b.classList.remove("on");
    layoutLists();
  }

  // ---------- Chat and log scrolling (transform only) ----------
  function layoutLists() {
    // Keep the newest visible chat message at the bottom of the part of the chat that is on screen.
    const fold = parseFloat(getComputedStyle(chat).getPropertyValue("--fold")) || 0.96;
    const viewTop = chatView.offsetTop;
    const visible = Math.min(chatView.clientHeight, chat.offsetHeight * fold - viewTop);
    const shown = [...chatList.children].filter((el) => el.classList.contains("on") || el.classList.contains("typing"));
    const last = shown[shown.length - 1];
    const bottom = last ? last.offsetTop + last.offsetHeight + 14 : 0;
    chatList.style.setProperty("--shift", Math.max(0, Math.round(bottom - visible)));
    // The log shows its last three entries.
    const entries = [...logList.children].filter((el) => el.classList.contains("on"));
    const rows = Math.max(0, entries.length - 3);
    const rowH = logList.firstElementChild ? logList.firstElementChild.offsetHeight : 0;
    logList.style.setProperty("--shift", rows * rowH);
  }

  // ---------- Fact flight: a chip lifts from the customer's words and lands on the Case ----------
  function fly(fact) {
    const row = stage.querySelector(`[data-target="${fact}"]`)?.closest(".fact");
    const tok = stage.querySelector(`.tok[data-fact="${fact}"]`);
    const target = stage.querySelector(`[data-target="${fact}"]`);
    if (!row || !tok || !target || reduced()) { row?.classList.add("on"); return; }
    const s = stage.getBoundingClientRect();
    const a = tok.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    if (!a.width || !b.width) { row.classList.add("on"); return; }
    const ghost = document.createElement("span");
    ghost.className = "fact-ghost";
    ghost.textContent = target.textContent;
    stage.appendChild(ghost);
    const padX = parseFloat(getComputedStyle(ghost).paddingLeft) || 0;
    const padY = parseFloat(getComputedStyle(ghost).paddingTop) || 0;
    const ax = a.left - s.left, ay = a.top - s.top - padY;
    const bx = b.left - s.left - padX, by = b.top - s.top - padY;
    const lift = Math.min(ay, by) - 22;
    const anim = ghost.animate([
      { transform: `translate(${ax}px, ${ay}px) scale(0.92)`, opacity: 0, easing: "ease-out" },
      { transform: `translate(${ax}px, ${ay - 6}px) scale(1)`, opacity: 1, offset: 0.14, easing: "cubic-bezier(0.45, 0, 0.2, 1)" },
      { transform: `translate(${(ax + bx) / 2}px, ${lift}px) scale(1.04)`, opacity: 1, offset: 0.55, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
      { transform: `translate(${bx}px, ${by}px) scale(1)`, opacity: 1, offset: 0.9, easing: "ease-out" },
      { transform: `translate(${bx}px, ${by}px) scale(1)`, opacity: 0 },
    ], { duration: 1000, fill: "both" });
    later(880, () => row.classList.add("on"));
    anim.onfinish = () => ghost.remove();
    anim.oncancel = () => ghost.remove();
  }

  // ---------- Choreography ----------
  function clearTimers() { for (const t of timers) clearTimeout(t); timers = []; }
  function later(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function run(action) {
    if (action === "layers") { stage.dataset.ready = ""; return; }
    if (action === "scan") { const el = byKey.get("scan")?.[0]; if (el) { el.classList.remove("on"); void el.offsetWidth; el.classList.add("on"); } return; }
    if (action.startsWith("typing:")) { for (const el of byKey.get(action.slice(7)) || []) el.classList.add("typing"); layoutLists(); return; }
    if (action.startsWith("fly:")) return fly(action.slice(4));
    if (action.startsWith("swap:")) { const [g, v] = action.slice(5).split("="); return setSwap(g, v); }
    if (action.startsWith("press:")) {
      const el = byKey.get(action.slice(6))?.[0];
      if (el) { el.classList.add("on"); later(260, () => el.classList.remove("on")); }
      return;
    }
    if (action.startsWith("-")) apply(action.slice(1), false);
    else apply(action, true);
    layoutLists();
  }
  function play(seq) { for (const [ms, action] of seq) later(ms, () => run(action)); }

  // The real workspace capture is fetched only once the story reaches the owner chapter, so first visits
  // never pay for it. The final section shows the same file, so it is then already cached.
  const realShot = stage.querySelector(".real-shot");
  function loadReal(n) {
    if (realShot && n >= 5 && !realShot.src) realShot.src = realShot.dataset.src;
  }
  const wrap = stage.closest(".stage-wrap");

  function go(n) {
    if (n === current) return;
    const prev = current;
    current = n;
    loadReal(n);
    wrap?.classList.toggle("is-real", n === 8);
    stage.classList.toggle("is-settling", !(prev !== null && n === prev + 1) || reduced());
    if (prev !== null && n === prev + 1 && !reduced()) {
      settle(prev);            // finish whatever was mid-flight
      stage.dataset.state = String(n);
      layoutLists();
      play(SEQUENCES[n]);
      later(4200, layoutLists);
    } else {
      stage.dataset.state = String(n);
      settle(n);
    }
  }

  // ---------- Arrival: assemble the hero on load ----------
  // Returns false (and shows the settled hero) when motion is reduced or the page opened mid-scroll.
  function intro() {
    const startInView = window.scrollY < innerHeight * 0.3;
    if (reduced() || !startInView) { stage.dataset.ready = ""; return false; }
    current = 0;
    stage.dataset.state = "0";
    settle(-1);
    stage.classList.add("is-intro");
    later(INTRO_START.layers, () => run("layers"));
    later(INTRO_START.layers + 1300, () => stage.classList.remove("is-intro"));
    play(SEQUENCES[0]);
    return true;
  }

  addEventListener("resize", () => layoutLists(), { passive: true });
  reduceMotion.addEventListener?.("change", () => { if (current !== null) settle(current); });

  return { go, intro, get current() { return current; } };
}
