(() => {
  "use strict";

  const CONFIG = window.YINYUAN_CONFIG || {};
  const STORAGE = {
    traces: "yinyuan.v01.traces",
    events: "yinyuan.v01.events",
    feedback: "yinyuan.v01.feedback",
    draft: "yinyuan.v01.draft",
  };

  const views = [...document.querySelectorAll("[data-view]")];
  const entryView = document.querySelector('[data-view="entry"]');
  const gateCopyTracks = [...document.querySelectorAll("[data-copy-track]")];
  const recordView = document.querySelector('[data-view="record"]');
  const arrivalView = document.querySelector('[data-view="arrival"]');
  const pauseAtGate = document.querySelector("#pause-at-gate");
  const guideLink = document.querySelector("#guide-link");
  const guideDialog = document.querySelector("#guide-dialog");
  const guideClose = document.querySelector("#guide-close");
  const guideStart = document.querySelector("#guide-start");
  const guideLearnMore = document.querySelector("#guide-learn-more");
  const lightToggle = document.querySelector("#light-toggle");
  const lightToggleLabel = document.querySelector("#light-toggle-label");
  const hoverClock = document.querySelector("#hover-clock");
  const hoverView = document.querySelector('[data-view="hover"]');
  const garden3DRoot = document.querySelector("#garden-3d-root");
  const livingGarden = document.querySelector("#living-garden");
  const livingWater = document.querySelector("#living-water");
  const gardenBird = document.querySelector("#garden-bird");
  const gardenStones = document.querySelector("#garden-stones");
  if (gardenStones && garden3DRoot) garden3DRoot.append(gardenStones);
  const gardenPlaceNav = document.querySelector("#garden-place-nav");
  const returnOverview = document.querySelector("#return-overview");
  const gardenFullscreenToggle = document.querySelector("#garden-fullscreen-toggle");
  const gardenFullscreenLabel = document.querySelector("#garden-fullscreen-label");
  const placeWhisper = document.querySelector("#place-whisper");
  const waterRetreatHint = document.querySelector("#water-retreat-hint");
  const stoneMemoryWhisper = document.querySelector("#stone-memory-whisper");
  const gardenMemoryCard = document.querySelector("#garden-memory-card");
  if (gardenMemoryCard) document.body.append(gardenMemoryCard);
  const memoryCardClose = document.querySelector("#memory-card-close");
  const memoryCardDate = document.querySelector("#memory-card-date");
  const memoryCardPlace = document.querySelector("#memory-card-place");
  const memoryCardCopy = document.querySelector("#memory-card-copy");
  const memoryCardNote = document.querySelector("#memory-card-note");
  const memoryCardSound = document.querySelector("#memory-card-sound");
  const memoryCardDelete = document.querySelector("#memory-card-delete");
  const hoverWritePlace = document.querySelector("#hover-write-place");
  const placeWritingCard = document.querySelector("#place-writing-card");
  const placeWritingClose = document.querySelector("#place-writing-close");
  const placeWritingInput = document.querySelector("#place-writing-input");
  const placeWritingContext = document.querySelector("#place-writing-context");
  const placeWritingSave = document.querySelector("#place-writing-save");
  const placeWritingSkip = document.querySelector("#place-writing-skip");
  const hoverIntro = document.querySelector("#hover-intro");
  const hoverReflection = document.querySelector("#hover-reflection");
  const soundToggle = document.querySelector("#sound-toggle");
  const soundLabel = document.querySelector("#sound-label");
  const gardenWindAudio = document.querySelector("#garden-wind-audio");
  const SOUND_SCENES = {
    garden: {
      src: gardenWindAudio?.dataset.gardenSrc || gardenWindAudio?.getAttribute("src") || "",
      volume: 0.92,
    },
    water: {
      src: gardenWindAudio?.dataset.waterSrc || "",
      volume: 0.92,
    },
  };
  const finishHoverButton = document.querySelector("#finish-hover");
  const placeStoneButton = document.querySelector("#place-stone");
  const leaveWithoutTraceButton = document.querySelector("#leave-without-trace");
  const reflectionBackButton = document.querySelector("#reflection-back");
  const note = document.querySelector("#trace-note");
  const noteCount = document.querySelector("#note-count");
  const writingCount = document.querySelector("#writing-count");
  const draftStatus = document.querySelector("#draft-status");
  const recordActions = document.querySelector("#record-actions");
  const arrivalSaved = document.querySelector("#arrival-saved");
  const arrivalPrimary = document.querySelector("#arrival-primary");
  const arrivalSecondary = document.querySelector("#arrival-secondary");
  const gardenList = document.querySelector("#garden-list");
  const gardenRecordEmpty = document.querySelector("#garden-record-empty");
  const gardenRecordContent = document.querySelector("#garden-record-content");
  const gardenRecordKind = document.querySelector("#garden-record-kind");
  const gardenRecordQuote = document.querySelector("#garden-record-quote");
  const gardenRecordEvent = document.querySelector("#garden-record-event");
  const gardenRecordRelation = document.querySelector("#garden-record-relation");
  const gardenRecordDate = document.querySelector("#garden-record-date");
  const gardenRecordPlace = document.querySelector("#garden-record-place");
  const gardenRecordNav = document.querySelector("#garden-record-nav");
  const gardenRecordNewer = document.querySelector("#garden-record-newer");
  const gardenRecordOlder = document.querySelector("#garden-record-older");
  const gardenRecordPosition = document.querySelector("#garden-record-position");
  const gardenRecordMore = document.querySelector("#garden-record-more");
  const gardenRecordDelete = document.querySelector("#garden-record-delete");
  const gardenStackViewport = document.querySelector("#garden-stack-viewport");
  const gardenScrollCue = document.querySelector("#garden-scroll-cue");
  const gardenReturnGate = document.querySelector(".garden-return-gate");
  const traceRemoveDialog = document.querySelector("#trace-remove-dialog");
  const traceRemoveTitle = document.querySelector("#trace-remove-title");
  const traceRemoveCopy = document.querySelector("#trace-remove-copy");
  const toast = document.querySelector("#toast");
  const researchPanel = document.querySelector("#research-panel");
  const researchTrigger = document.querySelector("#research-trigger");

  let hoverStartedAt = null;
  let hoverTimer = null;
  let soundRevealTimer = null;
  let writeRevealTimer = null;
  let finishRevealTimer = null;
  let introFadeTimer = null;
  let longPressTimer = null;
  let stoneWhisperTimer = null;
  let audioFadeTimer = null;
  let soundSceneSwitchToken = 0;
  let currentSoundScene = "garden";
  const soundScenePositions = { garden: 0, water: 0 };
  let waterAudioContext = null;
  let waterAudioBuffer = null;
  let waterAudioLoadPromise = null;
  let waterAudioSource = null;
  let waterGainNode = null;
  let waterStartedAt = 0;
  let waterStartOffset = 0;
  let waterIsPlaying = false;
  let waterUsesMediaFallback = false;
  let waterRetreatTimer = null;
  let waterHintTimer = null;
  let waterHintHideTimer = null;
  let lastWaterPointer = null;
  let waterKeyboardNavigation = false;
  let waterRetreatGuidanceCompleted = false;
  let hoverSoundUsed = false;
  let hoverReflectionReturnState = null;
  let currentGardenPlace = "overview";
  let hoverVisitedPlaces = [];
  let openMemoryTraceId = null;
  let gardenRecordIndex = 0;
  let gardenRecordTraceId = null;
  let pendingDeleteTraceId = null;
  let soundscape = null;
  let currentView = "entry";
  let presenceLightTimer = null;
  let toastTimer = null;
  let draftTimer = null;
  let entryTimer = null;
  let entryCopyTimer = null;
  let currentEntryCopy = 0;
  let isSavingTrace = false;
  let arrivalBirdAudioPlayed = false;

  const GARDEN_SOUND_MOMENTS = [
    { start: 1.5, end: 7.5, cue: "bird" },
    { start: 11.5, end: 19.5, cue: "string" },
    { start: 24.5, end: 33.5, cue: "bamboo" },
    { start: 36.5, end: 45.5, cue: "cricket" },
    { start: 48.5, end: 59.5, cue: "xiao" },
    { start: 63, end: 71.5, cue: "bamboo" },
    { start: 77.5, end: 87, cue: "cicada" },
    { start: 90.5, end: 99.5, cue: "string" },
    { start: 105.5, end: 116, cue: "bamboo" },
  ];

  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      showToast("浏览器没有允许保存，但你仍可以继续体验。", 3600);
      return false;
    }
  }

  function createId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function track(name, detail = {}) {
    const events = read(STORAGE.events);
    events.push({
      id: createId("event"),
      name,
      detail,
      at: new Date().toISOString(),
      version: CONFIG.version || "0.1.0",
    });
    write(STORAGE.events, events.slice(-1000));
    renderResearch();
  }

  function showToast(message, duration = 2400) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), duration);
  }

  function setLight(mode) {
    const nextMode = mode === "day" ? "day" : "night";
    const isDay = nextMode === "day";

    document.documentElement.dataset.light = nextMode;
    window.YinGarden3D?.setLight(nextMode);
    lightToggleLabel.textContent = isDay ? "日间" : "夜间";
    lightToggle.setAttribute("aria-label", isDay ? "切换为夜间光线" : "切换为日间光线");
    lightToggle.setAttribute("aria-pressed", String(!isDay));
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isDay ? "#26342f" : "#17231f");

    if (hoverView) updateGardenTime();
  }

  function initLight() {
    setLight(document.documentElement.dataset.light || "night");
  }

  function renderEntryCopyTriangle() {
    gateCopyTracks.forEach((track) => {
      const items = [...track.querySelectorAll("[data-gate-copy]")];
      items.forEach((item, index) => {
        const relative = (index - currentEntryCopy + items.length) % items.length;
        item.classList.toggle("is-current", relative === 0);
        item.classList.toggle("is-next", relative === 1);
        item.classList.toggle("is-previous", relative === 2);
      });
    });
  }

  function startEntryCopyTriangle() {
    if (!gateCopyTracks.length || gateCopyTracks.some((track) => track.querySelectorAll("[data-gate-copy]").length !== 3)) return;
    window.clearInterval(entryCopyTimer);
    renderEntryCopyTriangle();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    entryCopyTimer = window.setInterval(() => {
      currentEntryCopy = (currentEntryCopy + 1) % 3;
      renderEntryCopyTriangle();
    }, 8000);
  }

  const GARDEN_PLACES = {
    tree: {
      label: "树下",
      whisper: "树下有风，坐一会儿也好。",
      stoneCopy: "初秋 · 树下",
    },
    path: {
      label: "小径",
      whisper: "不必赶路，慢慢走几步就好。",
      stoneCopy: "初秋 · 小径",
    },
    water: {
      label: "水边",
      whisper: "水会继续流，你可以先留在这里。",
      stoneCopy: "初秋 · 水边",
    },
  };

  const staticGarden = {
    setMode(mode) {
      if (!garden3DRoot) return;
      garden3DRoot.dataset.mode = mode;
      garden3DRoot.classList.toggle("is-active", mode === "hover" || mode === "garden");
    },
    setPlace(place) {
      if (!garden3DRoot) return;
      window.clearTimeout(staticGarden.birdTimer);
      staticGarden.birdTimer = null;
      garden3DRoot.classList.remove("bird-has-arrived");
      garden3DRoot.dataset.place = place;
    },
    setLight() {},
    setTraces() {},
    addStone() {},
    focusTrace() {},
    windBurst() {
      if (!garden3DRoot || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (garden3DRoot.querySelector(".garden-drifting-seed")) return;
      const origins = { overview: [31, 79], tree: [34, 77], path: [5, 83], water: [20, 62] };
      const [originX, originY] = origins[currentGardenPlace] || origins.overview;
      const count = 3 + Math.floor(Math.random() * 5);
      for (let index = 0; index < count; index += 1) {
        const seed = document.createElement("span");
        seed.className = "garden-drifting-seed";
        seed.style.left = `${originX + (Math.random() - .5) * 2}%`;
        seed.style.top = `${originY + (Math.random() - .5) * 1.4}%`;
        seed.style.setProperty("--seed-dx", `${16 + Math.random() * 24}vw`);
        seed.style.setProperty("--seed-dy", `${-16 - Math.random() * 22}vh`);
        seed.style.setProperty("--seed-wander", `${-2 + Math.random() * 8}vw`);
        seed.style.setProperty("--seed-rotate", `${-45 + Math.random() * 115}deg`);
        seed.style.setProperty("--seed-delay", `${index * 90 + Math.random() * 180}ms`);
        seed.style.setProperty("--seed-duration", `${4400 + Math.random() * 2000}ms`);
        seed.style.setProperty("--seed-scale", `${.72 + Math.random() * .34}`);
        garden3DRoot.append(seed);
        seed.addEventListener("animationend", () => seed.remove(), { once: true });
      }
    },
  };

  if (!window.YinGarden3D) window.YinGarden3D = staticGarden;
  garden3DRoot?.classList.add("is-ready");
  document.body.classList.add("garden-3d-is-ready");

  function getGardenDaypart(date = new Date()) {
    const hour = date.getHours();
    if (document.documentElement.dataset.light === "night") return "night";
    if (hour >= 5 && hour < 9) return "dawn";
    if (hour >= 17 && hour < 20) return "dusk";
    return "day";
  }

  function getGardenDaypartLabel(daypart) {
    return {
      dawn: "一个清晨",
      day: "一个日间",
      dusk: "一个黄昏",
      night: "一个夜晚",
    }[daypart] || "某个时候";
  }

  function updateGardenTime() {
    hoverView.dataset.daypart = getGardenDaypart();
  }

  function clearWaterRetreatTimers() {
    clearTimeout(waterRetreatTimer);
    clearTimeout(waterHintTimer);
    clearTimeout(waterHintHideTimer);
    waterRetreatTimer = null;
    waterHintTimer = null;
    waterHintHideTimer = null;
  }

  function waterInterfaceIsBusy() {
    const activeElement = document.activeElement;
    const hasFocusedControl = activeElement instanceof HTMLElement && (
      activeElement.closest("#hover-controls, #garden-place-nav, .hover-quiet-actions, #return-overview, #garden-fullscreen-toggle")
    );
    return Boolean(
      (waterKeyboardNavigation && hasFocusedControl)
      || !placeWritingCard?.hidden
      || !gardenMemoryCard?.hidden
      || hoverView.classList.contains("is-reflecting")
      || hoverView.classList.contains("is-choosing")
      || hoverView.classList.contains("is-leaving")
      || soundToggle.disabled
    );
  }

  function hideWaterRetreatHint() {
    hoverView.classList.remove("water-retreat-hint-is-visible");
    waterRetreatHint?.setAttribute("aria-hidden", "true");
  }

  function showWaterRetreatHint() {
    if (
      currentView !== "hover"
      || currentGardenPlace !== "water"
      || !hoverView.classList.contains("water-ui-is-quiet")
    ) return;
    if (waterRetreatHint) {
      waterRetreatHint.textContent = window.matchMedia("(pointer: coarse)").matches
        ? "想再做些什么，轻触一下就好。"
        : "想再做些什么，轻轻动一下鼠标就好。";
      waterRetreatHint.setAttribute("aria-hidden", "false");
    }
    hoverView.classList.add("water-retreat-hint-is-visible");
    waterRetreatGuidanceCompleted = true;
    waterHintHideTimer = setTimeout(hideWaterRetreatHint, 3600);
  }

  function enterWaterQuietState() {
    if (currentView !== "hover" || currentGardenPlace !== "water") return;
    if (waterInterfaceIsBusy()) {
      waterRetreatTimer = setTimeout(enterWaterQuietState, 1500);
      return;
    }
    clearWaterRetreatTimers();
    hideWaterRetreatHint();
    hoverView.classList.add("water-ui-is-quiet");
    document.body.classList.add("water-ui-is-quiet");
    if (!waterRetreatGuidanceCompleted) {
      waterHintTimer = setTimeout(showWaterRetreatHint, 1400);
    }
    lastWaterPointer = null;
    track("water_interface_retreated", { afterSeconds: getHoverDuration() });
  }

  function armWaterInterfaceRetreat() {
    clearWaterRetreatTimers();
    if (currentView !== "hover" || currentGardenPlace !== "water") return;
    waterRetreatTimer = setTimeout(enterWaterQuietState, 7000);
  }

  function restoreWaterInterface(reason = "unknown", { rearm = true } = {}) {
    const wasQuiet = hoverView.classList.contains("water-ui-is-quiet");
    hoverView.classList.remove("water-ui-is-quiet");
    document.body.classList.remove("water-ui-is-quiet");
    hideWaterRetreatHint();
    if (wasQuiet) {
      track("water_interface_restored", { reason, afterSeconds: getHoverDuration() });
    }
    if (rearm) armWaterInterfaceRetreat();
  }

  function leaveWaterInterfaceMode() {
    clearWaterRetreatTimers();
    restoreWaterInterface("place-change", { rearm: false });
    document.body.classList.remove("water-ui-can-retreat");
    lastWaterPointer = null;
  }

  function gardenIsFullscreen() {
    return Boolean(document.fullscreenElement);
  }

  function syncGardenFullscreenControl() {
    if (!gardenFullscreenToggle || !gardenFullscreenLabel) return;
    const available = Boolean(document.fullscreenEnabled);
    const isWater = currentView === "hover" && currentGardenPlace === "water";
    const isFullscreen = gardenIsFullscreen();
    gardenFullscreenToggle.hidden = !available || !isWater;
    gardenFullscreenToggle.setAttribute("aria-pressed", String(isFullscreen));
    gardenFullscreenToggle.setAttribute(
      "aria-label",
      isFullscreen ? "回到窗口" : "让园子铺开",
    );
    gardenFullscreenToggle.removeAttribute("title");
    gardenFullscreenLabel.textContent = isFullscreen ? "回到窗口" : "让园子铺开";
  }

  async function toggleGardenFullscreen() {
    if (!document.fullscreenEnabled) return false;
    const wasFullscreen = gardenIsFullscreen();
    try {
      if (wasFullscreen) {
        await document.exitFullscreen();
      } else {
        try {
          await document.documentElement.requestFullscreen({ navigationUI: "hide" });
        } catch {
          await document.documentElement.requestFullscreen();
        }
      }
    } catch (error) {
      console.warn("Fullscreen request was not completed.", error);
    } finally {
      syncGardenFullscreenControl();
      restoreWaterInterface("fullscreen-change");
    }
    return gardenIsFullscreen() !== wasFullscreen;
  }

  function setGardenPlace(place, options = {}) {
    const nextPlace = place === "overview" || GARDEN_PLACES[place] ? place : "overview";
    currentGardenPlace = nextPlace;
    if (nextPlace !== "overview" && hoverStartedAt && !hoverVisitedPlaces.includes(nextPlace)) {
      hoverVisitedPlaces.push(nextPlace);
    }
    window.clearTimeout(staticGarden.birdTimer);
    staticGarden.birdTimer = null;
    garden3DRoot?.classList.remove("bird-has-arrived", "wind-is-passing");
    if (garden3DRoot) garden3DRoot.dataset.place = nextPlace;
    closeMemoryCard();
    closePlaceWriting();
    hoverView.dataset.place = nextPlace;
    gardenPlaceNav?.querySelectorAll("[data-place]").forEach((button) => {
      const current = nextPlace !== "overview" && button.dataset.place === nextPlace;
      button.classList.toggle("is-current", current);
      button.setAttribute("aria-current", current ? "true" : "false");
    });
    if (returnOverview) returnOverview.hidden = nextPlace === "overview";
    syncGardenFullscreenControl();
    if (placeWhisper) {
      placeWhisper.textContent = nextPlace === "overview"
        ? "想停在哪里，再轻轻选一处。"
        : GARDEN_PLACES[nextPlace].whisper;
    }
    syncSoundForPlace();
    window.YinGarden3D?.setPlace(nextPlace);
    if (options.announce) {
      hoverView.classList.add("intro-has-faded", "sound-position-locked");
      track("hover_place_changed", { place: nextPlace });
    }
    if (nextPlace === "water") {
      document.body.classList.add("water-ui-can-retreat");
      restoreWaterInterface("water-entered");
    } else {
      leaveWaterInterfaceMode();
    }
  }

  function stableHash(value) {
    return [...String(value)].reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
  }

  function getStonePosition(trace, index) {
    const place = GARDEN_PLACES[trace.location] ? trace.location : "tree";
    const seed = stableHash(trace.id || `${trace.createdAt}-${index}`);
    const ranges = {
      tree: { x: [14, 32], y: [72, 84] },
      path: { x: [38, 56], y: [76, 87] },
      water: { x: [59, 73], y: [77, 87] },
    };
    const range = ranges[place];
    return {
      place,
      x: range.x[0] + (seed % (range.x[1] - range.x[0])),
      y: range.y[0] + ((seed >>> 5) % (range.y[1] - range.y[0])),
      size: 17 + ((seed >>> 9) % 13),
      rotate: -13 + ((seed >>> 13) % 27),
    };
  }

  function getStoneMemoryCopy(trace) {
    const place = GARDEN_PLACES[trace.location] || GARDEN_PLACES.tree;
    return `${getSeasonLabel(trace.createdAt)} · ${getGardenDaypartLabel(trace.daypart || getGardenDaypart(new Date(trace.createdAt))).replace("一个", "")} · ${place.label}`;
  }

  function getSeasonLabel(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if ((month === 2 && day >= 4) || month === 3 || month === 4 || (month === 5 && day < 6)) return "春日";
    if ((month === 5 && day >= 6) || month === 6 || month === 7 || (month === 8 && day < 8)) return "夏日";
    if ((month === 8 && day >= 8) || month === 9 || month === 10 || (month === 11 && day < 7)) return month === 8 ? "初秋" : "秋日";
    return "冬日";
  }

  function formatMemoryDate(value) {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(new Date(value));
  }

  function openMemoryCard(trace, anchor = null) {
    if (!trace || !gardenMemoryCard) return;
    const place = GARDEN_PLACES[trace.location] || GARDEN_PLACES.tree;
    openMemoryTraceId = trace.id;
    memoryCardDate.dateTime = trace.createdAt;
    memoryCardDate.textContent = formatMemoryDate(trace.createdAt);
    memoryCardPlace.textContent = `${trace.season || getSeasonLabel(trace.createdAt)} · ${getGardenDaypartLabel(trace.daypart).replace("一个", "")} · ${place.label}`;
    memoryCardCopy.textContent = trace.location === "path"
      ? "那天，你沿着小径走了几步。"
      : trace.location === "water"
        ? "那天，你在水边看了一会儿水。"
        : "那天，你在树下坐了一会儿。";
    if (memoryCardNote) {
      memoryCardNote.textContent = trace.note || "";
      memoryCardNote.hidden = !trace.note;
    }
    if (memoryCardSound) memoryCardSound.hidden = !trace.soundUsed;
    if (anchor?.anchorX != null) {
      gardenMemoryCard.style.setProperty("--stone-anchor-x", `${anchor.anchorX}px`);
      gardenMemoryCard.style.setProperty("--stone-anchor-y", `${anchor.anchorY}px`);
      const cardWidth = Math.min(345, window.innerWidth - 48);
      const onRight = anchor.anchorX < window.innerWidth * 0.66;
      const left = onRight ? anchor.anchorX + 34 : anchor.anchorX - cardWidth - 34;
      gardenMemoryCard.style.setProperty("--memory-card-left", `${Math.max(24, Math.min(window.innerWidth - cardWidth - 24, left))}px`);
      gardenMemoryCard.dataset.anchorSide = onRight ? "left" : "right";
    }
    gardenMemoryCard.hidden = false;
    requestAnimationFrame(() => gardenMemoryCard.classList.add("is-open"));
  }

  function closeMemoryCard() {
    if (!gardenMemoryCard) return;
    openMemoryTraceId = null;
    gardenMemoryCard.classList.remove("is-open");
    setTimeout(() => { gardenMemoryCard.hidden = true; }, 360);
  }

  function showStoneMemory(trace, anchor = null) {
    if (!stoneMemoryWhisper) return;
    clearTimeout(stoneWhisperTimer);
    stoneMemoryWhisper.textContent = `你在 ${getStoneMemoryCopy(trace)} 停过一会。`;
    openMemoryCard(trace, anchor);
    stoneMemoryWhisper.hidden = false;
    requestAnimationFrame(() => stoneMemoryWhisper.classList.add("is-visible"));
    stoneWhisperTimer = setTimeout(() => {
      stoneMemoryWhisper.classList.remove("is-visible");
      setTimeout(() => { stoneMemoryWhisper.hidden = true; }, 900);
    }, 4200);
  }

  function renderRememberedStones(options = {}) {
    if (!gardenStones) return;
    const traces = read(STORAGE.traces)
      .filter((trace) => trace.kind === "stone" || trace.kind === "hover" || trace.kind === "water")
      .slice(0, 12);
    gardenStones.replaceChildren();
    window.YinGarden3D?.setTraces(traces);
    traces.forEach((trace, index) => {
      const position = getStonePosition(trace, index);
      const stone = document.createElement("button");
      stone.type = "button";
      stone.className = "remembered-stone";
      stone.dataset.place = position.place;
      stone.style.setProperty("--stone-x", `${position.x}%`);
      stone.style.setProperty("--stone-y", `${position.y}%`);
      stone.style.setProperty("--stone-size", `${position.size}px`);
      stone.style.setProperty("--stone-rotate", `${position.rotate}deg`);
      stone.setAttribute("aria-label", getStoneMemoryCopy(trace));
      if (options.newTraceId === trace.id) stone.classList.add("is-new");
      stone.addEventListener("click", () => {
        const rect = stone.getBoundingClientRect();
        showStoneMemory(trace, { anchorX: rect.left + rect.width / 2, anchorY: rect.top + rect.height / 2 });
      });
      gardenStones.append(stone);
    });
  }

  function createWorldRipple(clientX, clientY, options = {}) {
    if (!livingGarden) return;
    const ripple = document.createElement("span");
    ripple.className = "world-ripple";
    ripple.style.setProperty("--ripple-x", `${clientX}px`);
    ripple.style.setProperty("--ripple-y", `${clientY}px`);
    if (options.quiet) ripple.style.opacity = "0.56";
    livingGarden.append(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  }

  function setExternalLinks() {
    if (CONFIG.guideUrl) {
      guideLearnMore.href = CONFIG.guideUrl;
    } else {
      guideLearnMore.hidden = true;
    }

  }

  function formatDurationClock(totalSeconds) {
    const secondsValue = Math.max(0, Number(totalSeconds) || 0);
    const minutes = String(Math.floor(secondsValue / 60)).padStart(2, "0");
    const seconds = String(secondsValue % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function createNoiseBuffer(context, seconds, brown = false) {
    const length = Math.floor(context.sampleRate * seconds);
    const buffer = context.createBuffer(2, length, context.sampleRate);

    for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex += 1) {
      const channel = buffer.getChannelData(channelIndex);
      let previous = 0;

      for (let index = 0; index < length; index += 1) {
        const white = (Math.random() * 2) - 1;
        if (brown) {
          previous = (previous + (0.018 * white)) / 1.018;
          channel[index] = previous * 3.2;
        } else {
          channel[index] = white;
        }
      }
    }

    return buffer;
  }

  function createGardenSoundscape() {
    let context = null;
    let master = null;
    const sources = [];
    const timers = [];
    let active = false;

    function schedule(callback, minDelay, maxDelay) {
      if (!active) return;
      const delay = minDelay + (Math.random() * (maxDelay - minDelay));
      const timer = window.setTimeout(() => {
        if (active) callback();
      }, delay);
      timers.push(timer);
    }

    function connectWithPosition(node, destination, panValue) {
      if (!context?.createStereoPanner) {
        node.connect(destination);
        return;
      }
      const panner = context.createStereoPanner();
      panner.pan.value = panValue;
      node.connect(panner).connect(destination);
    }

    function addGrassRustle() {
      if (!active || !context || !master) return;
      const now = context.currentTime;
      const duration = 1.2 + (Math.random() * 1.7);
      const rustle = context.createBufferSource();
      rustle.buffer = createNoiseBuffer(context, duration + 0.2, false);
      const band = context.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 1500 + (Math.random() * 900);
      band.Q.value = 0.7;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12 + (Math.random() * 0.07), now + 0.32);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      rustle.connect(band).connect(gain);
      connectWithPosition(gain, master, (Math.random() * 1.4) - 0.7);
      rustle.start(now);
      rustle.stop(now + duration + 0.1);
      schedule(addGrassRustle, 4300, 9800);
    }

    function addInsectCall() {
      if (!active || !context || !master) return;
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = 2850 + (Math.random() * 750);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      const calls = 2 + Math.floor(Math.random() * 3);
      for (let index = 0; index < calls; index += 1) {
        const start = now + (index * 0.19);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.028 + (Math.random() * 0.018), start + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
      }
      oscillator.connect(gain);
      connectWithPosition(gain, master, (Math.random() * 1.5) - 0.75);
      oscillator.start(now);
      oscillator.stop(now + (calls * 0.2) + 0.1);
      schedule(addInsectCall, 11000, 24000);
    }

    return {
      async start() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) throw new Error("audio-context-unavailable");

        context = new AudioContextClass();
        await context.resume();

        master = context.createGain();
        master.gain.setValueAtTime(0.0001, context.currentTime);
        active = true;
        master.gain.exponentialRampToValueAtTime(0.58, context.currentTime + 3.8);
        master.connect(context.destination);

        const wind = context.createBufferSource();
        wind.buffer = createNoiseBuffer(context, 14, false);
        wind.loop = true;
        const windHigh = context.createBiquadFilter();
        windHigh.type = "highpass";
        windHigh.frequency.value = 85;
        const windLow = context.createBiquadFilter();
        windLow.type = "lowpass";
        windLow.frequency.value = 940;
        windLow.Q.value = 0.35;
        const windGain = context.createGain();
        windGain.gain.value = 0.18;
        wind.connect(windHigh).connect(windLow).connect(windGain).connect(master);

        const air = context.createBufferSource();
        air.buffer = createNoiseBuffer(context, 18, true);
        air.loop = true;
        const airLow = context.createBiquadFilter();
        airLow.type = "lowpass";
        airLow.frequency.value = 370;
        const airGain = context.createGain();
        airGain.gain.value = 0.15;
        air.connect(airLow).connect(airGain).connect(master);

        const movement = context.createOscillator();
        movement.type = "sine";
        movement.frequency.value = 0.075;
        const movementDepth = context.createGain();
        movementDepth.gain.value = 0.052;
        movement.connect(movementDepth).connect(windGain.gain);

        const distantMovement = context.createOscillator();
        distantMovement.type = "sine";
        distantMovement.frequency.value = 0.043;
        const distantDepth = context.createGain();
        distantDepth.gain.value = 0.045;
        distantMovement.connect(distantDepth).connect(airGain.gain);

        [wind, air, movement, distantMovement].forEach((source) => {
          source.start();
          sources.push(source);
        });

        schedule(addGrassRustle, 1200, 3200);
        schedule(addInsectCall, 6500, 12500);
      },

      stop(fadeSeconds = 4) {
        if (!context || !master) return;
        active = false;
        timers.forEach((timer) => window.clearTimeout(timer));
        const now = context.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
        master.gain.exponentialRampToValueAtTime(0.0001, now + fadeSeconds);

        window.setTimeout(() => {
          sources.forEach((source) => {
            try { source.stop(); } catch { /* 声音已经停止。 */ }
          });
          context.close().catch(() => {});
          context = null;
          master = null;
        }, (fadeSeconds * 1000) + 120);
      },
    };
  }

  function getSoundSceneForPlace(place = currentGardenPlace) {
    return place === "water" ? "water" : "garden";
  }

  function getSoundCopy(scene, isPlaying) {
    if (scene === "water") return isPlaying ? "水声已开" : "听一会水声";
    return isPlaying ? "园声已开" : "听一会园声";
  }

  function setSoundButtonState(isPlaying) {
    const scene = getSoundSceneForPlace();
    const label = getSoundCopy(scene, isPlaying);
    soundToggle.setAttribute("aria-pressed", String(isPlaying));
    soundToggle.setAttribute("aria-label", isPlaying ? `${label}，点击关闭` : label);
    soundToggle.dataset.soundScene = scene;
    soundLabel.textContent = label;
    gardenBird?.classList.toggle("is-awake", isPlaying && scene === "garden");
    hoverView.classList.toggle("is-listening", isPlaying);
    if (!isPlaying) delete hoverView.dataset.soundCue;
  }

  function getWaterPosition() {
    if (waterUsesMediaFallback) {
      return Number.isFinite(gardenWindAudio.currentTime) ? gardenWindAudio.currentTime : waterStartOffset;
    }
    const duration = waterAudioBuffer?.duration || 0;
    if (!duration) return waterStartOffset;
    if (!waterIsPlaying || !waterAudioContext) return waterStartOffset % duration;
    return (waterStartOffset + waterAudioContext.currentTime - waterStartedAt) % duration;
  }

  function getCurrentSoundPosition() {
    if (currentSoundScene === "water") return getWaterPosition();
    return Number.isFinite(gardenWindAudio.currentTime) ? gardenWindAudio.currentTime : 0;
  }

  function isCurrentSoundPlaying() {
    return currentSoundScene === "water" ? waterIsPlaying : !gardenWindAudio.paused;
  }

  function getCurrentSoundVolume() {
    if (currentSoundScene === "water") {
      return waterUsesMediaFallback ? gardenWindAudio.volume : (waterGainNode?.gain.value || 0);
    }
    return gardenWindAudio.volume;
  }

  function setCurrentSoundVolume(volume) {
    const safeVolume = Math.max(0, Math.min(1, volume));
    if (currentSoundScene === "water") {
      if (waterUsesMediaFallback) gardenWindAudio.volume = safeVolume;
      else if (waterGainNode) waterGainNode.gain.value = safeVolume;
      return;
    }
    gardenWindAudio.volume = safeVolume;
  }

  async function ensureWaterAudioReady() {
    if (waterAudioBuffer && waterAudioContext && waterGainNode) return;
    if (waterAudioLoadPromise) return waterAudioLoadPromise;

    waterAudioLoadPromise = (async () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("Web Audio is unavailable");

      waterAudioContext ||= new AudioContextClass();
      waterGainNode ||= waterAudioContext.createGain();
      waterGainNode.gain.value = 0;
      waterGainNode.connect(waterAudioContext.destination);

      const response = await fetch(SOUND_SCENES.water.src, { cache: "force-cache" });
      if (!response.ok) throw new Error(`Water audio failed: ${response.status}`);
      const audioBytes = await response.arrayBuffer();
      waterAudioBuffer = await waterAudioContext.decodeAudioData(audioBytes);
    })();

    try {
      await waterAudioLoadPromise;
    } finally {
      waterAudioLoadPromise = null;
    }
  }

  async function playWaterSound(offset = soundScenePositions.water || 0) {
    const playWithMediaElement = async () => {
      waterUsesMediaFallback = true;
      if (gardenWindAudio.getAttribute("src") !== SOUND_SCENES.water.src) {
        gardenWindAudio.src = SOUND_SCENES.water.src;
      }
      gardenWindAudio.loop = true;
      if (gardenWindAudio.readyState < 1) {
        await new Promise((resolve, reject) => {
          gardenWindAudio.addEventListener("loadedmetadata", resolve, { once: true });
          gardenWindAudio.addEventListener("error", reject, { once: true });
          gardenWindAudio.load();
        });
      }
      if (Number.isFinite(gardenWindAudio.duration) && gardenWindAudio.duration > 0) {
        gardenWindAudio.currentTime = Math.min(
          Math.max(0, offset),
          Math.max(0, gardenWindAudio.duration - 0.1),
        );
      }
      await gardenWindAudio.play();
      waterStartOffset = gardenWindAudio.currentTime || 0;
      waterIsPlaying = true;
    };

    if (window.location.protocol === "file:") {
      await playWithMediaElement();
      return;
    }

    try {
      await ensureWaterAudioReady();
    } catch (error) {
      console.warn("Seamless water audio was unavailable; using the media fallback.", error);
      await playWithMediaElement();
      return;
    }

    waterUsesMediaFallback = false;
    if (waterAudioContext.state === "suspended") await waterAudioContext.resume();

    if (waterAudioSource) {
      waterAudioSource.onended = null;
      try { waterAudioSource.stop(); } catch { /* The old source already stopped. */ }
    }

    const duration = waterAudioBuffer.duration;
    waterStartOffset = duration ? Math.max(0, offset) % duration : 0;
    waterAudioSource = waterAudioContext.createBufferSource();
    waterAudioSource.buffer = waterAudioBuffer;
    waterAudioSource.loop = true;
    waterAudioSource.loopStart = 0;
    waterAudioSource.loopEnd = duration;
    waterAudioSource.connect(waterGainNode);
    waterAudioSource.start(0, waterStartOffset);
    waterStartedAt = waterAudioContext.currentTime;
    waterIsPlaying = true;
  }

  function pauseWaterSound() {
    if (!waterIsPlaying) return;
    waterStartOffset = getWaterPosition();
    soundScenePositions.water = waterStartOffset;
    waterIsPlaying = false;
    if (waterUsesMediaFallback) {
      gardenWindAudio.pause();
      return;
    }
    if (!waterAudioSource) return;
    waterAudioSource.onended = null;
    try { waterAudioSource.stop(); } catch { /* The source already stopped. */ }
    waterAudioSource.disconnect();
    waterAudioSource = null;
  }

  async function playCurrentSound(offset = soundScenePositions[currentSoundScene] || 0) {
    if (currentSoundScene === "water") {
      await playWaterSound(offset);
      return;
    }
    if (Number.isFinite(gardenWindAudio.duration) && gardenWindAudio.duration > 0) {
      gardenWindAudio.currentTime = Math.min(offset, Math.max(0, gardenWindAudio.duration - 0.1));
    }
    await gardenWindAudio.play();
  }

  function pauseCurrentSound() {
    if (currentSoundScene === "water") {
      pauseWaterSound();
      return;
    }
    gardenWindAudio.pause();
  }

  function assignSoundSource(scene) {
    const nextSource = SOUND_SCENES[scene]?.src;
    if (!nextSource || scene === currentSoundScene) return;

    soundScenePositions[currentSoundScene] = getCurrentSoundPosition();

    pauseCurrentSound();
    currentSoundScene = scene;
    if (scene === "water") return;

    gardenWindAudio.src = nextSource;

    const savedPosition = soundScenePositions[scene] || 0;
    if (savedPosition > 0) {
      gardenWindAudio.addEventListener("loadedmetadata", () => {
        if (currentSoundScene !== scene || !Number.isFinite(gardenWindAudio.duration)) return;
        gardenWindAudio.currentTime = Math.min(savedPosition, Math.max(0, gardenWindAudio.duration - 0.1));
      }, { once: true });
    }
  }

  function syncSoundForPlace() {
    const nextScene = getSoundSceneForPlace();
    const isPlaying = soundToggle.getAttribute("aria-pressed") === "true" && isCurrentSoundPlaying();
    setSoundButtonState(soundToggle.getAttribute("aria-pressed") === "true");
    if (nextScene === currentSoundScene) return;

    const switchToken = ++soundSceneSwitchToken;
    soundToggle.classList.add("is-switching");

    const finishSwitch = async () => {
      if (switchToken !== soundSceneSwitchToken) return;
      assignSoundSource(nextScene);

      if (!isPlaying) {
        soundToggle.classList.remove("is-switching");
        setSoundButtonState(false);
        return;
      }

      try {
        setCurrentSoundVolume(0);
        await playCurrentSound();
        if (switchToken !== soundSceneSwitchToken) return;
        setSoundButtonState(true);
        fadeWindAudio(SOUND_SCENES[nextScene].volume, 1400, () => {
          soundToggle.classList.remove("is-switching");
        });
      } catch (error) {
        soundToggle.classList.remove("is-switching");
        setSoundButtonState(false);
        console.error("Sound scene switch failed", error);
      }
    };

    if (isPlaying) {
      fadeWindAudio(0, 700, () => { void finishSwitch(); });
    } else {
      void finishSwitch();
    }
  }

  function updateGardenSoundScene() {
    if (!isCurrentSoundPlaying()) {
      delete hoverView.dataset.soundCue;
      return;
    }

    if (currentSoundScene === "water") {
      hoverView.dataset.soundCue = "water";
      return;
    }

    const currentTime = gardenWindAudio.currentTime;
    const moment = GARDEN_SOUND_MOMENTS.find(({ start, end }) => currentTime >= start && currentTime < end);
    hoverView.dataset.soundCue = moment?.cue || "quiet";
  }

  function fadeWindAudio(targetVolume, durationMs, onComplete) {
    clearInterval(audioFadeTimer);
    const startedAt = performance.now();
    const initialVolume = getCurrentSoundVolume();
    audioFadeTimer = setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / durationMs);
      const eased = 0.5 - (Math.cos(Math.PI * progress) / 2);
      setCurrentSoundVolume(initialVolume + ((targetVolume - initialVolume) * eased));
      if (progress >= 1) {
        clearInterval(audioFadeTimer);
        audioFadeTimer = null;
        onComplete?.();
      }
    }, 40);
  }

  async function toggleGardenSound() {
    const isPlaying = soundToggle.getAttribute("aria-pressed") === "true";

    if (isPlaying) {
      setSoundButtonState(false);
      fadeWindAudio(0, 1200, () => pauseCurrentSound());
      track("hover_sound_stopped", { afterSeconds: getHoverDuration() });
      return;
    }

    soundToggle.disabled = true;
    try {
      const requestedScene = getSoundSceneForPlace();
      if (requestedScene !== currentSoundScene) assignSoundSource(requestedScene);
      if (currentSoundScene !== "water" && (
        gardenWindAudio.ended || gardenWindAudio.currentTime >= gardenWindAudio.duration - 0.5
      )) {
        gardenWindAudio.currentTime = 0;
      }
      setCurrentSoundVolume(0);
      await playCurrentSound();
      fadeWindAudio(SOUND_SCENES[requestedScene].volume, 1800);
      hoverSoundUsed = true;
      setSoundButtonState(true);
      track("hover_sound_started", { afterSeconds: getHoverDuration(), scene: requestedScene });
    } catch (error) {
      setSoundButtonState(false);
      console.error("Sound playback failed", error);
    } finally {
      soundToggle.disabled = false;
    }
  }

  function stopGardenSound(fadeSeconds = 3.8) {
    setSoundButtonState(false);
    if (!isCurrentSoundPlaying()) return;
    fadeWindAudio(0, Math.max(100, fadeSeconds * 1000), () => pauseCurrentSound());
  }

  function stopHoverTimer() {
    clearInterval(hoverTimer);
    clearTimeout(soundRevealTimer);
    clearTimeout(writeRevealTimer);
    clearTimeout(finishRevealTimer);
    clearTimeout(introFadeTimer);
    clearTimeout(longPressTimer);
    hoverTimer = null;
    soundRevealTimer = null;
    writeRevealTimer = null;
    finishRevealTimer = null;
    introFadeTimer = null;
    longPressTimer = null;
  }

  function getHoverDuration() {
    if (!hoverStartedAt) return 0;
    return Math.max(0, Math.round((Date.now() - hoverStartedAt) / 1000));
  }

  function updateHoverClock() {
    const elapsed = getHoverDuration();
    hoverClock.textContent = formatDurationClock(elapsed);
    const progress = Math.min(1, elapsed / 600);
    hoverView.style.setProperty("--stay-progress", String(progress));
    hoverView.style.setProperty("--stay-shadow", (0.14 + (progress * 0.1)).toFixed(3));
  }

  function finalizeHover(outcome) {
    if (!hoverStartedAt) return 0;
    const durationSeconds = getHoverDuration();
    track("hover_completed", { outcome, soundUsed: hoverSoundUsed });
    stopHoverTimer();
    stopGardenSound();
    hoverStartedAt = null;
    return durationSeconds;
  }

  function resetHoverExperience() {
    hoverView.classList.remove("is-reflecting", "is-choosing", "intro-has-faded", "is-listening", "is-leaving", "sound-position-locked");
    delete hoverView.dataset.soundCue;
    hoverView.style.setProperty("--stay-progress", "0");
    hoverView.style.setProperty("--stay-shadow", "0.14");
    hoverIntro.hidden = false;
    hoverReflection.hidden = true;
    soundToggle.classList.add("is-visible");
    soundToggle.setAttribute("aria-hidden", "false");
    finishHoverButton.classList.remove("is-visible");
    finishHoverButton.setAttribute("aria-hidden", "true");
    hoverWritePlace?.classList.remove("is-visible");
    hoverWritePlace?.setAttribute("aria-hidden", "true");
    stoneMemoryWhisper?.classList.remove("is-visible");
    if (stoneMemoryWhisper) stoneMemoryWhisper.hidden = true;
    hoverSoundUsed = false;
    hoverVisitedPlaces = [];
    hoverReflectionReturnState = null;
    setGardenPlace("overview");
    updateGardenTime();
    renderRememberedStones();
    setSoundButtonState(false);
  }

  function startHover() {
    stopHoverTimer();
    clearInterval(audioFadeTimer);
    audioFadeTimer = null;
    pauseCurrentSound();
    setSoundButtonState(false);
    gardenWindAudio.currentTime = 0;
    waterStartOffset = 0;
    soundScenePositions.garden = 0;
    soundScenePositions.water = 0;
    try {
      const visitKey = "yinyuan.hover.visits.v3";
      const visits = Number(localStorage.getItem(visitKey) || "0") + 1;
      localStorage.setItem(visitKey, String(visits));
      const hasStone = read(STORAGE.traces).some((trace) => ["stone", "hover", "water"].includes(trace.kind));
      if (visits === 2 && hasStone && localStorage.getItem("yinyuan.stone-guide.seen.v3") !== "1") {
        localStorage.setItem("yinyuan.stone-guide.armed.v3", "1");
      }
    } catch {
      // 访问次数只用于一次性温柔引导，无法保存时不影响园境。
    }
    resetHoverExperience();
    hoverStartedAt = Date.now();
    updateHoverClock();
    track("hover_started");

    if (!arrivalBirdAudioPlayed) {
      arrivalBirdAudioPlayed = true;
      playDistantBirdCall(0.85);
    }

    hoverTimer = setInterval(updateHoverClock, 1000);

    introFadeTimer = setTimeout(() => {
      hoverView.classList.add("intro-has-faded", "sound-position-locked");
    }, 6800);

    writeRevealTimer = setTimeout(() => {
      hoverWritePlace?.classList.add("is-visible");
      hoverWritePlace?.setAttribute("aria-hidden", "false");
      track("hover_write_revealed", { afterSeconds: getHoverDuration() });
    }, 8000);

    finishRevealTimer = setTimeout(() => {
      finishHoverButton.classList.add("is-visible");
      finishHoverButton.setAttribute("aria-hidden", "false");
      track("hover_finish_revealed", { afterSeconds: getHoverDuration() });
    }, 12000);

  }

  function playDistantBirdCall(delaySeconds = 0) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      const context = new AudioContextClass();
      const master = context.createGain();
      const filter = context.createBiquadFilter();
      master.gain.value = 0.0001;
      filter.type = "bandpass";
      filter.frequency.value = 3100;
      filter.Q.value = 1.8;
      filter.connect(master).connect(context.destination);
      const now = context.currentTime + delaySeconds;
      master.gain.exponentialRampToValueAtTime(0.035, now + 0.04);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
      [0, 0.18, 0.52].forEach((offset, index) => {
        const oscillator = context.createOscillator();
        const voice = context.createGain();
        oscillator.type = index === 1 ? "triangle" : "sine";
        oscillator.frequency.setValueAtTime(2600 + index * 230, now + offset);
        oscillator.frequency.exponentialRampToValueAtTime(3600 - index * 120, now + offset + 0.11);
        oscillator.frequency.exponentialRampToValueAtTime(2850 + index * 90, now + offset + 0.24);
        voice.gain.setValueAtTime(0.0001, now + offset);
        voice.gain.exponentialRampToValueAtTime(0.42, now + offset + 0.025);
        voice.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.27);
        oscillator.connect(voice).connect(filter);
        oscillator.start(now + offset);
        oscillator.stop(now + offset + 0.3);
      });
      setTimeout(() => context.close(), (delaySeconds * 1000) + 1800);
    } catch {
      // 远处鸟声无法播放时，园子仍保持安静。
    }
  }

  function saveStoneTrace(noteText = "") {
    const traces = read(STORAGE.traces);
    const trace = {
      id: createId("stone"),
      expression: "一颗小石头",
      kind: "stone",
      location: currentGardenPlace,
      visitedPlaces: hoverVisitedPlaces.length
        ? [...hoverVisitedPlaces]
        : (GARDEN_PLACES[currentGardenPlace] ? [currentGardenPlace] : []),
      daypart: getGardenDaypart(),
      season: getSeasonLabel(),
      soundUsed: hoverSoundUsed,
      note: String(noteText || "").trim().slice(0, 120),
      createdAt: new Date().toISOString(),
    };
    traces.unshift(trace);
    if (!write(STORAGE.traces, traces)) return null;
    track("hover_stone_placed", { location: trace.location, daypart: trace.daypart, soundUsed: trace.soundUsed });
    return trace;
  }

  function openPlaceWriting() {
    if (!placeWritingCard) return;
    closeMemoryCard();
    if (placeWritingContext) {
      placeWritingContext.textContent = currentGardenPlace === "tree"
        ? "这句话会和一颗石头一起留在你现在坐着的地方。"
        : "这句话会和一颗石头一起留在你现在站着的地方。";
    }
    hoverView.classList.add("place-writing-is-open");
    soundToggle?.setAttribute("aria-hidden", "true");
    if (soundToggle) soundToggle.tabIndex = -1;
    placeWritingCard.hidden = false;
    requestAnimationFrame(() => placeWritingCard.classList.add("is-open"));
    setTimeout(() => placeWritingInput?.focus(), 360);
  }

  function closePlaceWriting() {
    if (!placeWritingCard) return;
    hoverView.classList.remove("place-writing-is-open");
    soundToggle?.setAttribute("aria-hidden", "false");
    if (soundToggle) soundToggle.tabIndex = 0;
    placeWritingCard.classList.remove("is-open");
    setTimeout(() => { placeWritingCard.hidden = true; }, 320);
  }

  function leavePlaceMemory(withNote = true) {
    const text = withNote ? placeWritingInput?.value.trim() : "";
    const trace = saveStoneTrace(text || "");
    if (!trace) return;
    window.YinGarden3D?.addStone(trace);
    if (placeWritingInput) placeWritingInput.value = "";
    closePlaceWriting();
    if (placeWhisper) {
      const locationLabel = GARDEN_PLACES[currentGardenPlace]?.label || "园里";
      placeWhisper.textContent = text
        ? `这句话和一颗石头，一起留在${locationLabel}了。`
        : `一颗石头留在${locationLabel}了。`;
    }
    setTimeout(() => {
      if (placeWhisper) {
        placeWhisper.textContent = currentGardenPlace === "overview"
          ? "想停在哪里，再轻轻选一处。"
          : GARDEN_PLACES[currentGardenPlace].whisper;
      }
    }, 4200);
  }

  function formatDurationText(totalSeconds) {
    const value = Math.max(0, Number(totalSeconds) || 0);
    if (value < 60) return `${Math.max(1, value)}秒`;
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return seconds ? `${minutes}分${seconds}秒` : `${minutes}分钟`;
  }

  function finishHover() {
    if (!hoverStartedAt) return;
    const soundWasUsed = hoverSoundUsed;
    hoverReflectionReturnState = {
      elapsedSeconds: getHoverDuration(),
      place: currentGardenPlace,
      visitedPlaces: [...hoverVisitedPlaces],
      soundWasPlaying: soundToggle.getAttribute("aria-pressed") === "true" && isCurrentSoundPlaying(),
      soundCurrentTime: getCurrentSoundPosition(),
      soundWasUsed,
    };
    finalizeHover("paused_before_leaving");
    hoverSoundUsed = soundWasUsed;
    hoverIntro.hidden = false;
    hoverReflection.hidden = false;
    hoverView.classList.add("is-reflecting");
    track("hover_leaving_choice_opened", { place: currentGardenPlace });
  }

  async function returnToHoverFromReflection() {
    const returnState = hoverReflectionReturnState;
    if (!returnState) return;

    clearInterval(audioFadeTimer);
    audioFadeTimer = null;
    hoverReflection.hidden = true;
    hoverView.classList.remove("is-reflecting", "is-choosing", "is-leaving");
    hoverView.classList.add("intro-has-faded", "sound-position-locked");
    hoverIntro.hidden = false;
    finishHoverButton.classList.add("is-visible");
    finishHoverButton.setAttribute("aria-hidden", "false");
    hoverWritePlace?.classList.add("is-visible");
    hoverWritePlace?.setAttribute("aria-hidden", "false");
    soundToggle.classList.add("is-visible");
    soundToggle.setAttribute("aria-hidden", "false");

    currentGardenPlace = returnState.place;
    hoverVisitedPlaces = [...(returnState.visitedPlaces || [])];
    hoverSoundUsed = returnState.soundWasUsed;
    hoverStartedAt = Date.now() - (returnState.elapsedSeconds * 1000);
    updateHoverClock();
    hoverTimer = setInterval(updateHoverClock, 1000);
    hoverReflectionReturnState = null;

    if (returnState.soundWasPlaying) {
      try {
        setCurrentSoundVolume(0);
        await playCurrentSound(returnState.soundCurrentTime);
        setSoundButtonState(true);
        updateGardenSoundScene();
        fadeWindAudio(SOUND_SCENES[getSoundSceneForPlace()].volume, 900);
      } catch {
        setSoundButtonState(false);
      }
    } else {
      pauseCurrentSound();
      setSoundButtonState(false);
    }

    track("hover_leaving_choice_cancelled", { place: currentGardenPlace });
  }

  function placeStoneAndLeave() {
    const trace = saveStoneTrace();
    if (!trace) {
      return;
    }
    window.YinGarden3D?.addStone(trace);
    renderRememberedStones({ newTraceId: trace.id });
    hoverView.classList.add("is-leaving");
    showToast("小石头已经回到你的园中。", 1800);
    setTimeout(() => navigate("garden", { hoverFinalized: true, newTraceId: trace.id }), 560);
  }

  function leaveHoverWithoutTrace() {
    hoverView.classList.add("is-leaving");
    setTimeout(() => navigate("garden", { hoverFinalized: true }), 560);
  }

  function navigate(name, options = {}) {
    if (currentView === "hover" && name !== "hover" && hoverStartedAt && !options.hoverFinalized) {
      finalizeHover("left_early");
    }

    if (currentView === "record" && name !== "record" && !options.recordFinalized) {
      saveDraft();
    }

    const target = views.find((view) => view.dataset.view === name);
    if (!target) return;

    views.forEach((view) => {
      const isTarget = view === target;
      view.hidden = !isTarget;
      view.classList.toggle("is-active", isTarget);
    });

    currentView = name;
    document.body.dataset.view = name;
    syncGardenFullscreenControl();
    window.YinGarden3D?.setMode(name);
    document.querySelector("#app").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (name === "hover") startHover();
    if (name === "record") prepareRecord(options);
    if (name === "garden") renderGarden({
      newTraceId: options.newTraceId,
      resetSelection: !options.newTraceId,
    });

    if (!options.silent) track("view_opened", { view: name });
  }

  function readDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(STORAGE.draft) || "null");
      return typeof draft?.text === "string" ? draft.text : "";
    } catch {
      return "";
    }
  }

  function clearDraft() {
    clearTimeout(draftTimer);
    try {
      localStorage.removeItem(STORAGE.draft);
    } catch {
      // 清理失败不影响已经完成的记录。
    }
    setDraftStatus("");
  }

  function setDraftStatus(message) {
    draftStatus.textContent = message;
    draftStatus.classList.toggle("is-visible", Boolean(message));
  }

  function saveDraft() {
    const text = note.value;
    try {
      if (text.trim()) {
        localStorage.setItem(STORAGE.draft, JSON.stringify({ text, updatedAt: new Date().toISOString() }));
        setDraftStatus("已在本机悄悄保存");
      } else {
        localStorage.removeItem(STORAGE.draft);
        setDraftStatus("");
      }
    } catch {
      setDraftStatus("当前草稿暂时无法保存");
    }
  }

  function resizeWritingField() {
    note.style.height = "auto";
    const maxHeight = window.innerHeight * (window.innerWidth <= 620 ? 0.34 : 0.42);
    note.style.height = `${Math.min(note.scrollHeight, maxHeight)}px`;
  }

  function updateWritingState(options = {}) {
    const length = note.value.length;
    const hasWriting = Boolean(note.value.trim());

    noteCount.textContent = String(length);
    writingCount.hidden = length < 1600;
    recordView.classList.toggle("has-writing", hasWriting);
    recordActions.classList.toggle("is-visible", hasWriting);
    recordActions.setAttribute("aria-hidden", String(!hasWriting));
    resizeWritingField();

    if (!options.silent) {
      clearTimeout(draftTimer);
      setDraftStatus("");
      draftTimer = setTimeout(saveDraft, 1800);
    }
  }

  function prepareRecord(options = {}) {
    recordView.classList.remove("is-releasing");
    isSavingTrace = false;

    if (options.fresh) {
      note.value = "";
      clearDraft();
    } else {
      note.value = readDraft();
      if (note.value.trim()) setDraftStatus("草稿还在这里");
    }

    updateWritingState({ silent: true });

    if (window.matchMedia("(pointer: fine)").matches) {
      setTimeout(() => note.focus({ preventScroll: true }), 520);
    }
  }

  function beginEntry(target) {
    clearTimeout(entryTimer);
    entryView.classList.add("is-entering");
    document.body.classList.add("is-entering");
    pauseAtGate.disabled = true;
    pauseAtGate.setAttribute("aria-label", "正在走进悬停时刻");
    track("garden_entered", { path: target });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    entryTimer = setTimeout(() => {
      entryView.classList.remove("is-entering");
      document.body.classList.remove("is-entering");
      pauseAtGate.disabled = false;
      pauseAtGate.setAttribute("aria-label", "先停一会");
      navigate(target);
    }, reducedMotion ? 40 : 1180);
  }

  function saveTrace() {
    if (isSavingTrace) return;
    const content = note.value.trim();
    if (!content) return;

    const traces = read(STORAGE.traces);
    const trace = {
      id: createId("trace"),
      expression: "一枚种子",
      kind: "seed",
      note: content,
      stage: "seed",
      createdAt: new Date().toISOString(),
    };
    traces.unshift(trace);
    if (!write(STORAGE.traces, traces)) return;

    isSavingTrace = true;
    clearDraft();
    track("trace_saved", {
      kind: trace.kind,
      noteLength: trace.note.length,
    });
    setArrival({ saved: true, trace });
    recordView.classList.add("is-releasing");

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => navigate("arrival", { recordFinalized: true }), reducedMotion ? 40 : 920);
  }

  function setArrival({ saved, trace = null }) {
    const eyebrow = document.querySelector("#arrival-eyebrow");
    const title = document.querySelector("#arrival-title");
    const copy = document.querySelector("#arrival-copy");

    arrivalView.classList.toggle("is-empty", !saved);

    if (saved) {
      eyebrow.textContent = "一枚新落下的种子";
      title.textContent = "这一刻已经被你看见。";
      copy.textContent = "它不需要成为结论，也不要求你马上改变。";
      arrivalSaved.textContent = "它已经作为一枚种子，留在你的园里。";
      arrivalPrimary.textContent = "看看我的园";
      arrivalPrimary.dataset.go = "garden";
      arrivalSecondary.textContent = "再写一点";
    } else {
      eyebrow.textContent = "一次完整的留白";
      title.textContent = "什么都没留下，也是一种停留。";
      copy.textContent = "你不欠隐园一份记录。等想回来的时候，再回来。";
      arrivalSaved.textContent = "";
      arrivalPrimary.textContent = "回到园门";
      arrivalPrimary.dataset.go = "entry";
      arrivalSecondary.textContent = "写下此刻";
    }
  }

  function skipTrace(source) {
    track("trace_skipped", { source });
    setArrival({ saved: false });
    navigate("arrival");
  }

  function formatTime(iso) {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("zh-CN", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function formatGardenRecordDate(value) {
    const date = new Date(value);
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]} · ${hour}:${minute}`;
  }

  function getGardenRecordModel(trace) {
    const isWrittenMoment = trace.kind === "seed";
    const noteText = String(trace.note || "").trim();
    const place = GARDEN_PLACES[trace.location] || null;
    const visitedPlaces = Array.isArray(trace.visitedPlaces)
      ? trace.visitedPlaces.filter((item, index, list) => GARDEN_PLACES[item] && list.indexOf(item) === index)
      : (place ? [trace.location] : []);
    const route = visitedPlaces.map((item) => GARDEN_PLACES[item].label);
    const placeLabel = place?.label || route.at(-1) || "园中";
    const routeLabel = route.length > 1 ? route.join(" → ") : placeLabel;

    const visitLead = (() => {
      if (route.length === 3) return "那天，你在园里走了一圈：在树下坐过，沿小径走过，也在水边停过。";
      if (route.length === 2) {
        const [from, to] = visitedPlaces;
        if (from === "tree" && to === "path") return "那天，你先在树下坐了一会，后来沿小径走了几步。";
        if (from === "path" && to === "water") return "那天，你沿小径来到水边，在那里停了一会。";
        if (from === "tree" && to === "water") return "那天，你从树下走到水边，在两个地方都停过。";
        return `那天，你去过${route.join("和")}，也在园中停过。`;
      }
      if (trace.location === "path") return "那天，你沿小径走过一段，在路旁留下一颗石头。";
      if (trace.location === "water") return "那天，你在水边停过一会，把一颗石头留在水声旁。";
      return "那天，你在树下停过一会，留下一颗石头。";
    })();

    if (isWrittenMoment) {
      const relation = noteText.length <= 2
        ? "你留下了一点痕迹。这样也足够。"
        : noteText.length <= 8
          ? "你留下了一个词。园没有追问。"
          : noteText.length > 90
            ? "你曾在这里，把一些尚未想清楚的话慢慢写了下来。"
            : "这一刻没有被解释，只被你轻轻放进了园里。";
      return {
        kind: "园中一刻",
        quote: noteText,
        event: "",
        relation,
        place: "",
      };
    }

    if (noteText) {
      return {
        kind: "园中一刻",
        quote: noteText,
        event: "",
        relation: route.length > 1
          ? `${visitLead} 最后，你把这句话和一颗石头，一同留在了${placeLabel}。`
          : `你把这句话和一颗石头，一同留在了${placeLabel}。`,
        place: routeLabel,
      };
    }

    return {
      kind: "园中一刻",
      quote: "",
      event: route.length > 1
        ? `${visitLead} 最后，一颗石头留在了${placeLabel}。`
        : visitLead,
      relation: trace.location === "water"
        ? "水继续向前，石头留了下来。"
        : trace.location === "path"
          ? "园记得你曾在途中停下。"
          : "它还在原来的地方。",
      place: routeLabel,
    };
  }

  function getGardenRecords() {
    return read(STORAGE.traces).filter((trace) =>
      ["stone", "hover", "water", "seed"].includes(trace.kind) && trace.createdAt
    );
  }

  function renderGardenRecord(options = {}) {
    if (!gardenRecordEmpty || !gardenRecordContent) return;
    const records = getGardenRecords();

    if (!records.length) {
      gardenRecordTraceId = null;
      gardenRecordIndex = 0;
      gardenRecordEmpty.hidden = false;
      gardenRecordContent.hidden = true;
      if (gardenScrollCue) gardenScrollCue.hidden = true;
      return;
    }

    if (options.newTraceId) {
      gardenRecordIndex = Math.max(0, records.findIndex((trace) => trace.id === options.newTraceId));
    } else if (options.resetSelection) {
      gardenRecordIndex = 0;
    } else if (gardenRecordTraceId) {
      const retainedIndex = records.findIndex((trace) => trace.id === gardenRecordTraceId);
      if (retainedIndex >= 0) gardenRecordIndex = retainedIndex;
    }

    gardenRecordIndex = Math.max(0, Math.min(records.length - 1, gardenRecordIndex));
    const trace = records[gardenRecordIndex];
    const model = getGardenRecordModel(trace);
    gardenRecordTraceId = trace.id;

    gardenRecordEmpty.hidden = true;
    gardenRecordContent.hidden = false;
    gardenRecordKind.textContent = model.kind;
    gardenRecordQuote.textContent = model.quote;
    gardenRecordQuote.hidden = !model.quote;
    gardenRecordEvent.textContent = model.event;
    gardenRecordEvent.hidden = !model.event;
    gardenRecordRelation.textContent = model.relation;
    gardenRecordRelation.hidden = !model.relation;
    gardenRecordDate.dateTime = trace.createdAt;
    gardenRecordDate.textContent = formatGardenRecordDate(trace.createdAt);
    gardenRecordPlace.textContent = model.place;
    gardenRecordPlace.hidden = !model.place;
    gardenRecordNav.hidden = records.length < 2;
    if (gardenScrollCue) gardenScrollCue.hidden = records.length < 2;
    gardenRecordPosition.textContent = `${gardenRecordIndex + 1} / ${records.length}`;
    gardenRecordNewer.disabled = gardenRecordIndex === 0;
    gardenRecordOlder.disabled = gardenRecordIndex === records.length - 1;
    gardenRecordMore.open = false;
  }

  function renderGarden(options = {}) {
    const traces = read(STORAGE.traces);
    gardenList.replaceChildren();
    renderGardenRecord(options);
    const stones = traces.filter((trace) => ["stone", "hover", "water"].includes(trace.kind));
    window.YinGarden3D?.setTraces(stones);
    stones.forEach((trace) => {
      const access = document.createElement("button");
      access.type = "button";
      access.className = "garden-stone-access visually-hidden";
      access.textContent = `查看 ${formatMemoryDate(trace.createdAt)} 的停留`;
      access.addEventListener("click", () => {
        window.YinGarden3D?.focusTrace(trace.id);
        gardenRecordTraceId = trace.id;
        renderGardenRecord();
      });
      gardenList.append(access);
    });
  }

  function requestTraceRemoval(trace) {
    if (!trace) return;
    const isWrittenMoment = trace.kind === "seed";
    const hasNote = Boolean(String(trace.note || "").trim());
    pendingDeleteTraceId = trace.id;

    traceRemoveTitle.textContent = isWrittenMoment
      ? "要移除这个写下的此刻吗？"
      : hasNote
        ? "要移走这颗石头和留下的话吗？"
        : "要移走这颗石头吗？";
    traceRemoveCopy.textContent = isWrittenMoment
      ? "移除后，内容将无法找回。"
      : hasNote
        ? "移除后，它们将无法找回。"
        : "移除后，这次停留将无法找回。";

    if (typeof traceRemoveDialog?.showModal === "function") {
      traceRemoveDialog.returnValue = "";
      traceRemoveDialog.showModal();
      return;
    }

    if (window.confirm(`${traceRemoveTitle.textContent}\n${traceRemoveCopy.textContent}`)) {
      deleteTrace(trace.id, { confirmed: true });
    }
  }

  function deleteTrace(id, options = {}) {
    const traces = read(STORAGE.traces);
    const trace = traces.find((item) => item.id === id);
    if (!trace) return;
    if (!options.confirmed) {
      requestTraceRemoval(trace);
      return;
    }
    write(STORAGE.traces, traces.filter((item) => item.id !== id));
    track("trace_deleted", { traceId: id });
    closeMemoryCard();
    gardenRecordTraceId = null;
    renderRememberedStones();
    renderGarden();
    showToast("已从园中移除。", 2200);
  }

  function submitFeedback(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item = {
      id: createId("feedback"),
      permission: form.get("permission"),
      pressure: String(form.get("pressure") || "").trim(),
      keep: String(form.get("keep") || "").trim(),
      createdAt: new Date().toISOString(),
      version: CONFIG.version || "0.1.0",
    };
    const feedback = read(STORAGE.feedback);
    feedback.push(item);
    write(STORAGE.feedback, feedback);
    track("feedback_submitted", {
      permission: item.permission,
      hasPressureNote: Boolean(item.pressure),
      hasKeepNote: Boolean(item.keep),
    });
    event.currentTarget.reset();
    showToast("谢谢你。你的感受只保存在这台浏览器里。", 3400);
    navigate("entry");
  }

  function renderResearch() {
    const container = document.querySelector("#research-stats");
    if (!container) return;
    const events = read(STORAGE.events);
    const traces = read(STORAGE.traces);
    const feedback = read(STORAGE.feedback);
    const hoverCompletions = events.filter((event) => event.name === "hover_completed");
    const durations = hoverCompletions.map((event) => Number(event.detail.durationSeconds) || 0);
    const averageDuration = durations.length
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : 0;
    const permissionPositive = feedback.filter((item) => ["有", "有一点"].includes(item.permission)).length;

    const stats = [
      [hoverCompletions.length, "完成悬停"],
      [`${averageDuration}s`, "平均悬停"],
      [traces.length, "留下痕迹"],
      [`${permissionPositive}/${feedback.length}`, "感到可停下"],
    ];

    container.replaceChildren(...stats.map(([value, label]) => {
      const card = document.createElement("div");
      card.className = "stat-card";
      const strong = document.createElement("strong");
      strong.textContent = value;
      const span = document.createElement("span");
      span.textContent = label;
      card.append(strong, span);
      return card;
    }));
  }

  function downloadResearch() {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: CONFIG.version || "0.1.0",
      traces: read(STORAGE.traces),
      feedback: read(STORAGE.feedback),
      events: read(STORAGE.events),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `隐园V0.1-测试记录-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    track("research_exported");
  }

  function resetResearch() {
    const confirmed = window.confirm("要清空这台浏览器中的隐园痕迹、反馈和测试事件吗？此操作无法恢复。");
    if (!confirmed) return;
    Object.values(STORAGE).forEach((key) => localStorage.removeItem(key));
    renderResearch();
    renderGarden();
    showToast("本机测试数据已经清空。", 2400);
  }

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;

    if (gardenRecordMore?.open && !target?.closest("#garden-record-more")) {
      gardenRecordMore.open = false;
    }

    const go = target?.closest("[data-go]");
    if (go) navigate(go.dataset.go);

    const remove = target?.closest("[data-delete-trace]");
    if (remove) deleteTrace(remove.dataset.deleteTrace);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !gardenRecordMore?.open) return;
    gardenRecordMore.open = false;
    gardenRecordMore.querySelector("summary")?.focus();
  });

  gardenReturnGate?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    navigate("entry");
  });

  pauseAtGate.addEventListener("click", () => beginEntry("hover"));

  lightToggle.addEventListener("click", () => {
    const nextMode = document.documentElement.dataset.light === "day" ? "night" : "day";
    setLight(nextMode);
    track("light_changed", { mode: nextMode });
  });

  soundToggle.addEventListener("click", toggleGardenSound);
  finishHoverButton.addEventListener("click", finishHover);
  placeStoneButton.addEventListener("click", placeStoneAndLeave);
  leaveWithoutTraceButton.addEventListener("click", leaveHoverWithoutTrace);
  reflectionBackButton?.addEventListener("click", returnToHoverFromReflection);
  memoryCardClose?.addEventListener("click", closeMemoryCard);
  hoverWritePlace?.addEventListener("click", openPlaceWriting);
  placeWritingClose?.addEventListener("click", closePlaceWriting);
  placeWritingSave?.addEventListener("click", () => leavePlaceMemory(true));
  placeWritingSkip?.addEventListener("click", () => leavePlaceMemory(false));
  memoryCardDelete?.addEventListener("click", () => {
    if (openMemoryTraceId) deleteTrace(openMemoryTraceId);
  });
  function moveGardenRecord(direction) {
    const records = getGardenRecords();
    const nextIndex = Math.max(0, Math.min(records.length - 1, gardenRecordIndex + direction));
    if (nextIndex === gardenRecordIndex) return;
    gardenStackViewport?.classList.add(direction > 0 ? "is-moving-up" : "is-moving-down");
    gardenRecordIndex = nextIndex;
    gardenRecordTraceId = null;
    window.setTimeout(() => {
      renderGardenRecord();
      gardenStackViewport?.classList.remove("is-moving-up", "is-moving-down");
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180);
  }

  gardenRecordNewer?.addEventListener("click", () => moveGardenRecord(-1));
  gardenRecordOlder?.addEventListener("click", () => moveGardenRecord(1));

  let gardenWheelLocked = false;
  gardenStackViewport?.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaY) < 8 || gardenWheelLocked) return;
    event.preventDefault();
    gardenWheelLocked = true;
    moveGardenRecord(event.deltaY > 0 ? 1 : -1);
    window.setTimeout(() => { gardenWheelLocked = false; }, 520);
  }, { passive: false });

  gardenStackViewport?.addEventListener("keydown", (event) => {
    if (!["ArrowUp", "ArrowDown", "PageUp", "PageDown"].includes(event.key)) return;
    event.preventDefault();
    moveGardenRecord(event.key === "ArrowDown" || event.key === "PageDown" ? 1 : -1);
  });

  let gardenTouchStartY = null;
  gardenStackViewport?.addEventListener("touchstart", (event) => {
    gardenTouchStartY = event.touches[0]?.clientY ?? null;
  }, { passive: true });
  gardenStackViewport?.addEventListener("touchend", (event) => {
    if (gardenTouchStartY === null) return;
    const endY = event.changedTouches[0]?.clientY ?? gardenTouchStartY;
    const distance = gardenTouchStartY - endY;
    gardenTouchStartY = null;
    if (Math.abs(distance) < 28 || gardenWheelLocked) return;
    gardenWheelLocked = true;
    moveGardenRecord(distance > 0 ? 1 : -1);
    window.setTimeout(() => { gardenWheelLocked = false; }, 520);
  }, { passive: true });
  gardenRecordDelete?.addEventListener("click", () => {
    const trace = getGardenRecords().find((item) => item.id === gardenRecordTraceId);
    requestTraceRemoval(trace);
  });
  traceRemoveDialog?.addEventListener("close", () => {
    const traceId = pendingDeleteTraceId;
    pendingDeleteTraceId = null;
    if (traceRemoveDialog.returnValue === "confirm" && traceId) {
      deleteTrace(traceId, { confirmed: true });
    }
  });

  window.addEventListener("yinyuan:3d-ready", () => {
    document.body.classList.add("garden-3d-is-ready");
    window.YinGarden3D?.setMode(currentView);
    window.YinGarden3D?.setPlace(currentGardenPlace);
    window.YinGarden3D?.setLight(document.documentElement.dataset.light);
    renderRememberedStones();
  });

  window.addEventListener("yinyuan:stone-selected", (event) => {
    const trace = read(STORAGE.traces).find((item) => item.id === event.detail?.traceId);
    if (!trace) return;
    if (currentView === "garden") {
      gardenRecordTraceId = trace.id;
      renderGardenRecord();
    } else {
      openMemoryCard(trace, event.detail);
    }
  });

  window.addEventListener("yinyuan:stone-guide", () => {
    if (!stoneMemoryWhisper) return;
    stoneMemoryWhisper.textContent = "水里还留着你曾放下的东西。想看的时候，可以轻轻碰一碰。";
    stoneMemoryWhisper.hidden = false;
    requestAnimationFrame(() => stoneMemoryWhisper.classList.add("is-visible"));
    setTimeout(() => {
      stoneMemoryWhisper.classList.remove("is-visible");
      setTimeout(() => { stoneMemoryWhisper.hidden = true; }, 700);
    }, 5200);
  });

  gardenPlaceNav?.addEventListener("click", (event) => {
    const placeButton = event.target.closest("[data-place]");
    if (!placeButton) return;
    setGardenPlace(placeButton.dataset.place, { announce: true });
  });

  returnOverview?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    hoverView.classList.remove("is-reflecting", "is-choosing", "is-leaving");
    hoverReflection.hidden = true;
    hoverIntro.hidden = false;
    closePlaceWriting();
    closeMemoryCard();
    setGardenPlace("overview", { announce: true });
    returnOverview.blur();
  });

  gardenFullscreenToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const entering = !gardenIsFullscreen();
    toggleGardenFullscreen().then((didChange) => {
      if (!didChange) return;
      track(entering ? "water_fullscreen_entered" : "water_fullscreen_exited", {
        afterSeconds: getHoverDuration(),
      });
      gardenFullscreenToggle.blur();
    });
  });

  document.addEventListener("fullscreenchange", () => {
    syncGardenFullscreenControl();
    if (currentView === "hover" && currentGardenPlace === "water") {
      restoreWaterInterface("fullscreen-change");
    }
  });

  hoverView.addEventListener("pointermove", (event) => {
    const bounds = hoverView.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100));
    hoverView.style.setProperty("--presence-x", `${x.toFixed(1)}%`);
    hoverView.style.setProperty("--presence-y", `${y.toFixed(1)}%`);
    garden3DRoot?.style.setProperty("--garden-parallax-x", `${((x - 50) * -0.22).toFixed(2)}px`);
    garden3DRoot?.style.setProperty("--garden-parallax-y", `${((y - 50) * -0.14).toFixed(2)}px`);
  });

  window.addEventListener("pointermove", (event) => {
    if (!garden3DRoot) return;
    if (currentView !== "hover" || document.documentElement.dataset.light !== "night") return;
    const x = Math.max(0, Math.min(100, (event.clientX / window.innerWidth) * 100));
    const y = Math.max(0, Math.min(100, (event.clientY / window.innerHeight) * 100));
    garden3DRoot.style.setProperty("--presence-x", `${x.toFixed(1)}%`);
    garden3DRoot.style.setProperty("--presence-y", `${y.toFixed(1)}%`);
    garden3DRoot.classList.add("presence-is-moving");
    clearTimeout(presenceLightTimer);
    presenceLightTimer = setTimeout(() => garden3DRoot.classList.remove("presence-is-moving"), 1500);
  });

  window.addEventListener("pointerdown", (event) => {
    if (!garden3DRoot) return;
    if (currentView !== "hover" || document.documentElement.dataset.light !== "night") return;
    if (event.target.closest("button, a, input, textarea, summary, details")) return;
    const x = Math.max(0, Math.min(100, (event.clientX / window.innerWidth) * 100));
    const y = Math.max(0, Math.min(100, (event.clientY / window.innerHeight) * 100));
    garden3DRoot.style.setProperty("--presence-x", `${x.toFixed(1)}%`);
    garden3DRoot.style.setProperty("--presence-y", `${y.toFixed(1)}%`);
    garden3DRoot.classList.remove("presence-was-touched");
    void garden3DRoot.offsetWidth;
    garden3DRoot.classList.add("presence-was-touched");
    setTimeout(() => garden3DRoot.classList.remove("presence-was-touched"), 1500);
  });

  window.addEventListener("pointermove", (event) => {
    if (currentView !== "hover" || currentGardenPlace !== "water") {
      lastWaterPointer = null;
      return;
    }
    if (!lastWaterPointer) {
      lastWaterPointer = { x: event.clientX, y: event.clientY };
      if (hoverView.classList.contains("water-ui-is-quiet")) {
        restoreWaterInterface("pointer-move");
      }
      return;
    }
    const distance = Math.hypot(
      event.clientX - lastWaterPointer.x,
      event.clientY - lastWaterPointer.y,
    );
    if (distance < 10) return;
    lastWaterPointer = { x: event.clientX, y: event.clientY };
    restoreWaterInterface("pointer-move");
  }, { passive: true });

  window.addEventListener("pointerdown", (event) => {
    if (currentView !== "hover" || currentGardenPlace !== "water") return;
    waterKeyboardNavigation = false;
    const wasQuiet = hoverView.classList.contains("water-ui-is-quiet");
    restoreWaterInterface(event.pointerType === "touch" ? "touch" : "pointer-down");
    if (wasQuiet) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, { capture: true });

  window.addEventListener("wheel", () => {
    if (currentView === "hover" && currentGardenPlace === "water") {
      restoreWaterInterface("wheel");
    }
  }, { passive: true });

  window.addEventListener("keydown", (event) => {
    if (currentView !== "hover" || currentGardenPlace !== "water") return;
    if (event.key === "Tab") {
      waterKeyboardNavigation = true;
      restoreWaterInterface("keyboard-tab");
      return;
    }
    if (event.key === "Escape") {
      waterKeyboardNavigation = false;
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      restoreWaterInterface("escape");
      return;
    }
    restoreWaterInterface("keyboard");
  }, { capture: true });

  window.addEventListener("focusin", () => {
    if (currentView === "hover" && currentGardenPlace === "water") {
      restoreWaterInterface("focus");
    }
  });

  hoverView.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button, a, nav")) return;
    clearTimeout(longPressTimer);
    const { clientX, clientY } = event;
    longPressTimer = setTimeout(() => {
      createWorldRipple(clientX, clientY);
      window.YinGarden3D?.windBurst({ x: clientX, y: clientY });
      hoverView.classList.add("world-was-touched");
      setTimeout(() => hoverView.classList.remove("world-was-touched"), 2400);
      track("hover_world_touched", { place: currentGardenPlace });
    }, currentGardenPlace === "water" ? 280 : 620);
  });

  ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
    hoverView.addEventListener(eventName, () => {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    });
  });

  document.querySelector("#exit-hover").addEventListener("click", () => {
    finalizeHover("exited");
    navigate("entry", { hoverFinalized: true });
  });

  document.querySelector("#save-trace").addEventListener("click", saveTrace);
  gardenWindAudio.addEventListener("timeupdate", updateGardenSoundScene);
  gardenWindAudio.addEventListener("seeked", updateGardenSoundScene);
  gardenWindAudio.loop = true;
  gardenWindAudio.addEventListener("ended", () => {
    if (currentSoundScene === "water") return;
    if (currentView !== "hover" || soundToggle.getAttribute("aria-pressed") !== "true") {
      setSoundButtonState(false);
      return;
    }
    gardenWindAudio.currentTime = 0;
    gardenWindAudio.play().catch(() => setSoundButtonState(false));
  });
  arrivalSecondary.addEventListener("click", () => navigate("record", { fresh: true }));
  document.querySelector("#feedback-form").addEventListener("submit", submitFeedback);
  note.addEventListener("input", updateWritingState);
  window.addEventListener("resize", resizeWritingField);

  document.querySelector("#export-research").addEventListener("click", downloadResearch);
  document.querySelector("#reset-research").addEventListener("click", resetResearch);
  document.querySelector("#close-research").addEventListener("click", () => { researchPanel.hidden = true; });
  researchTrigger.addEventListener("click", () => {
    renderResearch();
    researchPanel.hidden = false;
  });

  guideLink.addEventListener("click", () => {
    guideDialog.showModal();
    document.body.classList.add("guide-is-open");
    track("onsite_guide_opened", { view: currentView });
  });
  const closeGuide = () => {
    guideDialog.close();
    document.body.classList.remove("guide-is-open");
  };
  guideClose.addEventListener("click", closeGuide);
  guideDialog.addEventListener("click", (event) => {
    if (event.target === guideDialog) closeGuide();
  });
  guideDialog.addEventListener("close", () => document.body.classList.remove("guide-is-open"));
  guideStart.addEventListener("click", () => {
    closeGuide();
    navigate("hover");
    track("onsite_guide_started_hover");
  });
  guideLearnMore.addEventListener("click", () => track("feishu_guide_opened", { source: "onsite_guide" }));
  window.addEventListener("pagehide", () => {
    if (currentView === "hover" && hoverStartedAt) finalizeHover("page_closed");
  });

  const researchMode = new URLSearchParams(window.location.search).get("research") === "1";
  if (researchMode) researchTrigger.hidden = false;

  initLight();
  startEntryCopyTriangle();
  setExternalLinks();
  renderResearch();
  renderGarden();
  track("prototype_loaded", { researchMode });
  navigate("entry", { silent: true });
})();
