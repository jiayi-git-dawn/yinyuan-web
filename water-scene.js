(() => {
  "use strict";
  const root = document.querySelector("#garden-3d-root");
  const video = document.querySelector("#garden-water-video");
  if (!root || !video) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let sourceReady = false;
  let sourceVariant = "";
  let generation = 0;
  let pendingPlay = null;
  const isWaterVisible = () => !document.hidden &&
    (document.body.dataset.view === "hover" || document.body.dataset.view === "garden") && root.dataset.place === "water";
  const getVariant = () => document.documentElement.dataset.light === "night" ? "night" : "day";

  function ensureSource() {
    const variant = getVariant();
    if (sourceVariant === variant && video.getAttribute("src") && !video.error) return;
    const source = video.dataset[`${variant}Src`];
    if (!source) return;
    generation++;
    pendingPlay = null;
    video.pause();
    root.classList.remove("water-video-active");
    sourceReady = false;
    sourceVariant = variant;
    const poster = video.dataset[`${variant}Poster`];
    if (poster) video.poster = poster;
    video.src = source;
    video.load();
    root.dataset.waterVideo = `loading-${variant}`;
  }

  async function sync() {
    if (!isWaterVisible()) {
      video.pause();
      // Keep the decoded frame while hidden instead of flashing the poster.
      if (!document.hidden) root.classList.remove("water-video-active");
      root.dataset.waterVideo = sourceReady ? `ready-${sourceVariant}` : "idle";
      return;
    }
    ensureSource();
    if (reducedMotion.matches) {
      video.pause();
      root.classList.remove("water-video-active");
      root.dataset.waterVideo = `still-${sourceVariant}`;
      return;
    }
    if (!sourceReady || pendingPlay) return;
    const currentGeneration = generation;
    const reveal = () => {
      if (currentGeneration !== generation || !isWaterVisible() || video.paused || reducedMotion.matches) return;
      root.classList.add("water-video-active");
      root.dataset.waterVideo = `active-${sourceVariant}`;
    };
    const play = video.play();
    pendingPlay = play;
    try {
      await play;
      if (currentGeneration !== generation) return;
      // Reveal only after a decoded frame exists, avoiding a black surface.
      if (root.classList.contains("water-video-active")) reveal();
      else if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(reveal);
      else requestAnimationFrame(reveal);
    } catch (error) {
      if (currentGeneration !== generation || !isWaterVisible() || error.name === "AbortError") return;
      root.dataset.waterVideo = "fallback";
      root.classList.remove("water-video-active");
    } finally {
      if (pendingPlay === play) pendingPlay = null;
    }
  }

  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["data-place"] });
  const pageObserver = new MutationObserver(sync);
  pageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-light"] });
  pageObserver.observe(document.body, { attributes: true, attributeFilter: ["data-view"] });
  document.addEventListener("visibilitychange", sync);
  reducedMotion.addEventListener?.("change", sync);
  video.addEventListener("canplay", () => {
    if (video.readyState < 2) return;
    // Native loop seeks also emit canplay. Keep the visible frame and don't
    // restart an already running video every time the stream loops.
    const firstReady = !sourceReady;
    sourceReady = true;
    if (firstReady || video.paused) sync();
  });
  video.addEventListener("error", () => {
    sourceReady = false;
    root.dataset.waterVideo = "fallback";
    root.classList.remove("water-video-active");
  });
  sync();
  window.YinWaterScene = {
    sync,
    getState: () => ({ active: isWaterVisible() && !video.paused, sourceReady, sourceVariant,
      source: video.currentSrc || video.src, light: document.documentElement.dataset.light,
      place: root.dataset.place, view: document.body.dataset.view, currentTime: video.currentTime }),
  };
})();
