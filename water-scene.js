(() => {
  "use strict";

  const root = document.querySelector("#garden-3d-root");
  const video = document.querySelector("#garden-water-video");
  if (!root || !video) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let sourceReady = false;
  let sourceVariant = "";
  let playRequest = 0;

  const isWaterVisible = () =>
    !document.hidden &&
    (document.body.dataset.view === "hover" || document.body.dataset.view === "garden") &&
    root.dataset.place === "water";

  const getVariant = () =>
    document.documentElement.dataset.light === "night" ? "night" : "day";

  const ensureSource = () => {
    const variant = getVariant();
    if (sourceVariant === variant && video.getAttribute("src")) return;

    const source = video.dataset[`${variant}Src`];
    const poster = video.dataset[`${variant}Poster`];
    if (!source) return false;

    video.pause();
    root.classList.remove("water-video-active");
    sourceReady = false;
    sourceVariant = variant;
    if (poster) video.poster = poster;
    video.src = source;
    video.load();
    root.dataset.waterVideo = `loading-${variant}`;
    return true;
  };

  const sync = async () => {
    const request = ++playRequest;
    const visible = isWaterVisible();

    if (!visible) {
      video.pause();
      root.classList.remove("water-video-active");
      root.dataset.waterVideo = sourceReady ? `ready-${sourceVariant}` : "idle";
      return;
    }

    ensureSource();
    if (reducedMotion.matches) {
      video.pause();
      video.currentTime = 0;
      root.classList.remove("water-video-active");
      root.dataset.waterVideo = `still-${sourceVariant}`;
      return;
    }

    if (!sourceReady) return;

    root.classList.add("water-video-active");
    root.dataset.waterVideo = `active-${sourceVariant}`;

    try {
      await video.play();
      if (request !== playRequest || !isWaterVisible()) video.pause();
    } catch (error) {
      root.dataset.waterVideo = "fallback";
      root.classList.remove("water-video-active");
      console.warn("[隐园水边] 动态水面暂时没有开始，已保留静态水面。", error);
    }
  };

  const rootObserver = new MutationObserver(sync);
  rootObserver.observe(root, { attributes: true, attributeFilter: ["data-place"] });

  const pageObserver = new MutationObserver(sync);
  pageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-light"] });
  pageObserver.observe(document.body, { attributes: true, attributeFilter: ["data-view"] });

  document.addEventListener("visibilitychange", sync);
  reducedMotion.addEventListener?.("change", sync);
  video.addEventListener("canplay", () => {
    sourceReady = true;
    sync();
  });
  video.addEventListener("error", () => {
    sourceReady = false;
    root.dataset.waterVideo = "fallback";
    root.classList.remove("water-video-active");
  });

  sync();

  window.YinWaterScene = {
    sync,
    getState: () => ({
      active: isWaterVisible() && !video.paused,
      sourceReady,
      sourceVariant,
      source: video.currentSrc || video.src,
      light: document.documentElement.dataset.light,
      place: root.dataset.place,
      view: document.body.dataset.view,
      currentTime: video.currentTime,
    }),
  };
})();
