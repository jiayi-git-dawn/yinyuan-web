(() => {
  "use strict";
  const root = document.querySelector("#garden-3d-root");
  const original = document.querySelector("#garden-water-video");
  if (!root || !original) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const night = original.cloneNode(false);
  night.id = "garden-water-video-night";
  original.after(night);
  const slots = { day: { video: original, pending: null, framePending: false }, night: { video: night, pending: null, framePending: false } };
  let visible = null;
  let pauseTimer = null;
  const variant = () => document.documentElement.dataset.light === "night" ? "night" : "day";
  const inWater = () => !document.hidden && ["hover", "garden"].includes(document.body.dataset.view) && root.dataset.place === "water";
  const shouldPlay = () => inWater() && !reduced.matches;
  function reveal(name) {
    const slot = slots[name];
    if (!shouldPlay() || name !== variant() || slot.video.paused || slot.video.readyState < 2) return;
    clearTimeout(pauseTimer);
    visible = name;
    for (const [key, item] of Object.entries(slots)) {
      // Hold the outgoing image fully opaque underneath the incoming layer;
      // fading both layers together would briefly darken the water.
      if (key !== name && item.video.classList.contains("is-current")) item.video.style.opacity = "1";
      if (key === name) item.video.style.removeProperty("opacity");
      item.video.classList.toggle("is-current", key === name);
      item.video.style.zIndex = key === name ? "2" : "1";
    }
    root.classList.add("water-video-active");
    root.dataset.waterVideo = `active-${name}`;
    // Keep the outgoing frame through the dissolve, decoded for the next visit.
    pauseTimer = setTimeout(() => {
      for (const [key, item] of Object.entries(slots)) if (key !== visible && key !== variant()) {
        item.video.style.removeProperty("opacity");
        item.video.pause();
      }
    }, 500);
  }
  function showDecoded(name) {
    const slot = slots[name];
    if (slot.framePending) return;
    slot.framePending = true;
    const done = () => { slot.framePending = false; reveal(name); };
    if (slot.video.requestVideoFrameCallback) slot.video.requestVideoFrameCallback(done);
    else requestAnimationFrame(done);
  }
  function prepare(name) {
    const v = slots[name].video;
    if (v.getAttribute("src")) return;
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.poster = original.dataset[`${name}Poster`];
    v.preload = "auto";
    v.src = original.dataset[`${name}Src`];
    v.load();
  }
  function sync() {
    if (!shouldPlay()) {
      clearTimeout(pauseTimer);
      for (const slot of Object.values(slots)) slot.video.pause();
      if (!document.hidden) {
        root.classList.remove("water-video-active");
        for (const slot of Object.values(slots)) {
          slot.video.classList.remove("is-current");
          slot.video.style.removeProperty("opacity");
        }
        visible = null;
      }
      return;
    }
    const name = variant(), slot = slots[name], v = slot.video;
    prepare(name);
    // Load each source once. Light switches never replace a playing source.
    prepare(name === "day" ? "night" : "day");
    if (slot.pending) return;
    if (!v.paused && v.readyState >= 2) { showDecoded(name); return; }
    const play = v.play();
    slot.pending = play;
    play.then(() => {
      if (shouldPlay() && variant() === name) showDecoded(name);
      else if (visible !== name) v.pause();
    }).catch(error => {
      if (error.name === "AbortError" && shouldPlay() && variant() === name) requestAnimationFrame(sync);
      if (error.name !== "AbortError" && variant() === name && shouldPlay()) root.dataset.waterVideo = `fallback-${name}`;
    }).finally(() => { if (slot.pending === play) slot.pending = null; });
  }
  for (const [name, slot] of Object.entries(slots)) {
    slot.video.addEventListener("canplay", () => { if (shouldPlay() && variant() === name) sync(); });
    slot.video.addEventListener("playing", () => showDecoded(name));
    slot.video.addEventListener("error", () => { if (name === variant()) root.dataset.waterVideo = `fallback-${name}`; });
  }
  const observer = new MutationObserver(sync);
  observer.observe(root, { attributes: true, attributeFilter: ["data-place"] });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-light"] });
  observer.observe(document.body, { attributes: true, attributeFilter: ["data-view"] });
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener?.("change", sync);
  sync();
  window.YinWaterScene = { sync, getState: () => {
    const name = variant(), v = slots[name].video;
    return { active: shouldPlay() && visible === name && !v.paused, sourceReady: v.readyState >= 2,
      sourceVariant: name, visibleVariant: visible, source: v.currentSrc || v.src,
      light: document.documentElement.dataset.light, place: root.dataset.place,
      view: document.body.dataset.view, currentTime: v.currentTime };
  }};
})();
