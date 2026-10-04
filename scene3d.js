import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Water } from "three/examples/jsm/objects/Water.js";

const STORAGE_KEY = "yinyuan.v01.traces";
const BIRD_SEEN_KEY = "yinyuan.hover.bird-seen.v3";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.querySelector("#garden-3d-root");
const canvas = document.querySelector("#garden-3d-canvas");
const loading = document.querySelector("#garden-3d-loading");

if (!root || !canvas) window.YinGarden3D = { available: false };
else boot();

async function boot() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xa7b3aa, 0.0125);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.08, 180);
  const cameraTarget = new THREE.Vector3();
  const pointerDrift = new THREE.Vector2();
  const desiredDrift = new THREE.Vector2();
  const anchors = {
    entrance: pose([-1.4, 3.5, 18.5], [0.6, 1.7, -5.8], 48),
    tree: pose([-3.25, 1.62, 12.7], [2.8, 1.25, -3.8], 47),
    path: pose([-0.62, 1.86, 7.4], [6.5, 1.46, -13.8], 43),
    water: pose([3.5, 1.38, 5.1], [5.2, 1.3, -4.1], 48),
    memory: pose([0.6, 3.15, 14.8], [2.5, 1.35, -3.2], 46),
  };
  camera.position.copy(anchors.entrance.position);
  cameraTarget.copy(anchors.entrance.target);
  camera.lookAt(cameraTarget);

  const world = new THREE.Group();
  scene.add(world);
  const clock = new THREE.Clock();
  const gltfLoader = new GLTFLoader();
  const textureLoader = new THREE.TextureLoader();

  const hemi = new THREE.HemisphereLight(0xd7ded3, 0x1a2d24, 1.45);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xf4ead0, 2.7);
  sun.position.set(-18, 25, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -25, near: 0.1, far: 75 });
  sun.shadow.bias = -0.00022;
  scene.add(sun);
  const coolFill = new THREE.DirectionalLight(0x91aaa5, 0.58);
  coolFill.position.set(18, 9, -18);
  scene.add(coolFill);
  const gardenLamp = new THREE.PointLight(0xeeb06c, 0, 11, 2);
  gardenLamp.position.set(-2.4, 3.3, -6.4);
  scene.add(gardenLamp);

  const forestMaps = await loadMaps(textureLoader);
  const groundMaterial = new THREE.MeshStandardMaterial({
    map: forestMaps.diffuse,
    normalMap: forestMaps.normal,
    roughnessMap: forestMaps.roughness,
    color: 0x697967,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.92,
  });
  const pathMaterial = groundMaterial.clone();
  pathMaterial.color.set(0x817e70);
  pathMaterial.roughness = 0.9;

  const leftBank = new THREE.Mesh(createBankGeometry("left"), groundMaterial);
  leftBank.receiveShadow = true;
  leftBank.visible = false;
  world.add(leftBank);
  const rightBankMaterial = groundMaterial.clone();
  rightBankMaterial.color.set(0x60715f);
  const rightBank = new THREE.Mesh(createBankGeometry("right"), rightBankMaterial);
  rightBank.receiveShadow = true;
  rightBank.visible = false;
  world.add(rightBank);
  const pathMesh = createPath(pathMaterial);
  pathMesh.material.transparent = true;
  pathMesh.material.opacity = 0.28;
  pathMesh.material.depthWrite = false;
  pathMesh.visible = false;
  world.add(pathMesh);

  const waterNormals = makeWaterNormals();
  const riverGeometry = createRiverGeometry();
  const water = new Water(riverGeometry, {
    textureWidth: 1024,
    textureHeight: 1024,
    waterNormals,
    sunDirection: new THREE.Vector3(-0.4, 0.8, 0.3),
    sunColor: 0xf0e2c6,
    waterColor: 0x6f8985,
    distortionScale: 0.46,
    alpha: 0.38,
    fog: true,
  });
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.18;
  water.material.transparent = true;
  water.material.depthWrite = false;
  water.material.side = THREE.DoubleSide;
  water.receiveShadow = true;
  water.renderOrder = 2;
  water.visible = false;
  world.add(water);
  const waterHit = new THREE.Mesh(riverGeometry.clone(), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  waterHit.rotation.x = -Math.PI / 2;
  waterHit.position.y = 0.22;
  world.add(waterHit);
  const riverBed = new THREE.Mesh(riverGeometry.clone(), new THREE.MeshStandardMaterial({ map: forestMaps.diffuse, normalMap: forestMaps.normal, color: 0x7a7666, roughness: 0.94, metalness: 0, side: THREE.DoubleSide }));
  riverBed.rotation.x = -Math.PI / 2;
  riverBed.position.y = -0.28;
  riverBed.visible = false;
  world.add(riverBed);

  const shallows = createShallows();
  shallows.visible = false;
  world.add(shallows);
  const reedSway = [];
  createReedBeds(world, reedSway);

  const rippleGroup = new THREE.Group();
  world.add(rippleGroup);
  const dynamicStoneGroup = new THREE.Group();
  dynamicStoneGroup.name = "MemoryShoal";
  dynamicStoneGroup.visible = false;
  world.add(dynamicStoneGroup);
  const plantSway = [];
  const fireflies = createFireflies(world);
  let dandelions = null;
  let bird = null;
  let treeRoot = null;
  let rockMaterialTemplate = null;
  let currentPlace = "overview";
  let currentMode = "entry";
  let guideStone = null;
  let guideStarted = 0;
  let birdTimeline = 0;
  let birdFirstVisit = !localStorage.getItem(BIRD_SEEN_KEY);

  try {
    const [rockAsset, fernAsset, birdAtlas, dandelionAtlas, backplateTexture] = await Promise.all([
      loadGltf(gltfLoader, "./assets/polyhaven/rock_moss_set_01/rock_moss_set_01_1k.gltf"),
      loadGltf(gltfLoader, "./assets/polyhaven/fern_02/fern_02_1k.gltf"),
      loadTexture(textureLoader, "./assets/japanese-white-eye-sprite-v1.webp", true),
      loadTexture(textureLoader, "./assets/dandelion-patch-photoreal-v1.webp", true),
      loadTexture(textureLoader, "./assets/garden-backplate-photoreal-v1.webp", true),
    ]);

    const rockMeshes = collectMeshes(rockAsset.scene);
    rockMaterialTemplate = rockMeshes[0] || null;
    const rockPlacements = [
      [-5.1, 0.02, 10.1, 1.2, 0.1], [-3.8, 0.01, 6.6, 0.82, -0.5], [-2.2, 0.01, 3.0, 0.58, 0.7],
      [3.55, 0.06, 4.9, 0.7, -0.2], [4.05, 0.02, 0.6, 0.5, 0.8], [4.25, 0.0, -3.9, 0.76, -0.9],
      [14.0, 0.02, 2.2, 0.66, 0.4], [14.5, 0.02, -6.5, 0.86, -0.7], [-1.8, 0.01, -7.9, 0.52, 0.2],
    ];
    rockPlacements.forEach((entry, index) => {
      const source = rockMeshes[index % rockMeshes.length];
      const rock = source.clone();
      rock.geometry = source.geometry;
      rock.material = source.material.clone();
      normalise(rock, 0.9 * entry[3]);
      rock.position.set(entry[0], entry[1], entry[2]);
      rock.rotation.y = entry[4];
      rock.castShadow = rock.receiveShadow = true;
      rock.visible = false;
      world.add(rock);
    });

    const fernVariants = collectMeshes(fernAsset.scene);
    [
      [-5.2, 0.02, 8.4, 0.34], [-4.5, 0.02, 6.7, 0.29], [-2.9, 0.02, 1.5, 0.25],
      [2.65, 0.03, 5.7, 0.72], [3.1, 0.02, -0.8, 0.92], [-1.8, 0.01, -5.4, 0.7],
      [3.55, 0.03, 9.3, 0.62], [14.3, 0.02, 5.8, 0.73], [13.8, 0.02, -2.4, 0.68],
    ].forEach((entry, index) => {
      const fern = fernVariants[index % fernVariants.length].clone();
      fern.material = fern.material.clone();
      normalise(fern, entry[3]);
      fern.position.set(entry[0], entry[1], entry[2]);
      fern.rotation.y = index * 1.27;
      fern.material.side = THREE.DoubleSide;
      fern.material.alphaTest = 0.35;
      fern.castShadow = true;
      fern.visible = false;
      world.add(fern);
      plantSway.push(fern);
    });

    reedSway.forEach((reed) => plantSway.push(reed));

    // The rooted plant already belongs to the photographic tree view.
    dandelions = null;
    bird = null;
    setTraces(readTraces());
    root.classList.add("is-ready");
    document.body.classList.add("garden-3d-is-ready");
    loading?.classList.add("is-ready");
    setTimeout(() => loading?.remove(), 1200);
    window.dispatchEvent(new CustomEvent("yinyuan:3d-ready"));
  } catch (error) {
    console.error("隐园3D场景加载失败", error);
    root.classList.add("has-failed", "is-ready");
    if (loading) loading.textContent = "园子正在雾后慢慢显现";
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pointerDownPosition = new THREE.Vector2();
  let pointerDownAt = 0;
  let windEnergy = 0;

  const cameraJourney = {
    active: false, start: 0, duration: 3200,
    positionCurve: null, targetCurve: null, fromFov: 46, toFov: 46,
  };

  root.addEventListener("pointermove", (event) => {
    desiredDrift.set((event.clientX / innerWidth - 0.5) * 2, (event.clientY / innerHeight - 0.5) * 2);
  });
  root.addEventListener("pointerdown", (event) => {
    pointerDownAt = performance.now();
    pointerDownPosition.set(event.clientX, event.clientY);
  });
  root.addEventListener("pointerup", (event) => {
    if (!['hover', 'garden'].includes(currentMode)) return;
    const held = performance.now() - pointerDownAt;
    const moved = pointerDownPosition.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);
    const stoneHit = raycaster.intersectObjects(dynamicStoneGroup.children, true).find((hit) => findTrace(hit.object));
    if (stoneHit && moved < 15) {
      const trace = findTrace(stoneHit.object);
      guideStone = null;
      focusTrace(trace);
      const projected = stoneHit.point.clone().project(camera);
      window.dispatchEvent(new CustomEvent("yinyuan:stone-selected", { detail: {
        trace, traceId: trace.id,
        anchorX: (projected.x * 0.5 + 0.5) * innerWidth,
        anchorY: (-projected.y * 0.5 + 0.5) * innerHeight,
      }}));
      return;
    }
    const hit = raycaster.intersectObject(waterHit, false)[0];
    const isQuietWaterArea = event.clientX > innerWidth * (currentPlace === "water" ? 0.28 : 0.56)
      && event.clientY > innerHeight * 0.28
      && !event.target.closest("button, a, input, textarea, summary, details");
    if (moved < 12 && isQuietWaterArea) {
      if (hit) createRipple(hit.point);
      createScreenRipple(event.clientX, event.clientY);
    }
    if (held > 520 && moved < 20) windBurst(hit?.point || raycaster.ray.at(7, new THREE.Vector3()));
  });

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  }

  function createScreenRipple(clientX, clientY) {
    const ripple = document.createElement("span");
    ripple.className = "garden-touch-ripple";
    ripple.style.left = `${clientX}px`;
    ripple.style.top = `${clientY}px`;
    root.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  }

  function setPlace(place, immediate = false) {
    if (place === "overview") {
      currentPlace = "overview";
      root.dataset.place = "overview";
      cameraJourney.active = false;
      camera.position.copy(anchors.entrance.position);
      cameraTarget.copy(anchors.entrance.target);
      camera.fov = anchors.entrance.fov;
      camera.updateProjectionMatrix();
      return;
    }
    if (!anchors[place]) return;
    currentPlace = place;
    root.dataset.place = place;
    travelTo(anchors[place], place, immediate ? 1 : 3400);
    if (place === "tree" && currentMode === "hover") scheduleFirstBird();
  }

  function travelTo(anchor, destination, duration) {
    const start = camera.position.clone();
    const startTarget = cameraTarget.clone();
    const midway = start.clone().lerp(anchor.position, 0.5);
    const midTarget = startTarget.clone().lerp(anchor.target, 0.5);
    if (destination === "path") { midway.y += 0.62; midway.z -= 1.4; }
    if (destination === "water") { midway.x += 1.3; midway.y += 0.28; }
    if (destination === "tree") { midway.x -= 0.9; midway.y += 0.18; }
    if (destination === "memory") midway.y += 1.1;
    cameraJourney.active = true;
    cameraJourney.start = performance.now();
    cameraJourney.duration = reducedMotion ? 1 : duration;
    cameraJourney.positionCurve = new THREE.CatmullRomCurve3([start, midway, anchor.position.clone()], false, "centripetal");
    cameraJourney.targetCurve = new THREE.CatmullRomCurve3([startTarget, midTarget, anchor.target.clone()], false, "centripetal");
    cameraJourney.fromFov = camera.fov;
    cameraJourney.toFov = anchor.fov;
  }

  function setMode(mode) {
    currentMode = mode;
    root.dataset.mode = mode;
    root.classList.toggle("is-active", mode === "hover" || mode === "garden" || mode === "threshold");
    if (mode === "threshold") travelTo(anchors.entrance, "entrance", 2200);
    if (mode === "garden") travelTo(anchors.memory, "memory", 2900);
    if (mode === "hover") {
      setPlace(currentPlace || "overview", false);
      scheduleFirstBird();
      scheduleStoneGuide();
    }
  }

  function scheduleFirstBird() {
    if (!birdFirstVisit || currentMode !== "hover") return;
    setTimeout(() => {
      if (currentMode !== "hover" || currentPlace !== "tree") return;
      root.classList.add("bird-has-arrived");
      localStorage.setItem(BIRD_SEEN_KEY, "1");
      birdFirstVisit = false;
      window.dispatchEvent(new CustomEvent("yinyuan:bird-arrived"));
    }, 7400);
  }

  function scheduleStoneGuide() {
    const armed = localStorage.getItem("yinyuan.stone-guide.armed.v3") === "1";
    const seen = localStorage.getItem("yinyuan.stone-guide.seen.v3") === "1";
    if (dynamicStoneGroup.children.length && armed && !seen) {
      guideStone = dynamicStoneGroup.children[0];
      guideStarted = performance.now() + 5200;
      setTimeout(() => {
        if (currentMode !== "hover" || !guideStone) return;
        localStorage.setItem("yinyuan.stone-guide.seen.v3", "1");
        localStorage.removeItem("yinyuan.stone-guide.armed.v3");
        window.dispatchEvent(new CustomEvent("yinyuan:stone-guide"));
      }, 5200);
    }
  }

  function setLight(mode) { lightState.target = mode === "night" ? 0 : 1; }

  function setTraces(traces) {
    dynamicStoneGroup.clear();
    const memories = traces.filter((trace) => ["stone", "hover", "water"].includes(trace.kind)).slice(0, 18);
    memories.forEach((trace, index) => dynamicStoneGroup.add(makeMemoryStone(trace, index, rockMaterialTemplate)));
    if (currentMode === "hover") scheduleStoneGuide();
  }

  function addStone(trace) {
    const stone = makeMemoryStone(trace, dynamicStoneGroup.children.length, rockMaterialTemplate);
    stone.userData.restY = stone.position.y;
    stone.position.y += 1.8;
    stone.userData.baseScale = stone.scale.clone();
    stone.scale.multiplyScalar(0.06);
    stone.userData.arrivingAt = performance.now();
    dynamicStoneGroup.add(stone);
    createRipple(new THREE.Vector3(stone.position.x, 0.2, stone.position.z));
  }

  function focusTrace(traceOrId) {
    const id = typeof traceOrId === "string" ? traceOrId : traceOrId?.id;
    const stone = dynamicStoneGroup.children.find((item) => item.userData.trace?.id === id);
    if (!stone) return;
    const target = stone.position.clone().add(new THREE.Vector3(0, 0.18, 0));
    const focusPose = pose([camera.position.x, camera.position.y, camera.position.z], [target.x, target.y, target.z], camera.fov);
    travelTo(focusPose, currentPlace, 820);
  }

  function windBurst(origin) {
    windEnergy = Math.min(2.2, windEnergy + 1.25);
    releaseScreenSeeds();
    root.classList.add("wind-is-passing");
    setTimeout(() => root.classList.remove("wind-is-passing"), 1900);
  }

  function releaseScreenSeeds() {
    if (reducedMotion || root.querySelector(".garden-drifting-seed")) return;
    const count = 3 + Math.floor(Math.random() * 5);
    const origins = { tree: [34, 77], path: [3.5, 84], water: [21, 61] };
    const [originX, originY] = origins[currentPlace] || origins.tree;
    for (let index = 0; index < count; index += 1) {
      const seed = document.createElement("span");
      seed.className = "garden-drifting-seed";
      seed.style.left = `${originX + (Math.random() - .5) * 1.8}%`;
      seed.style.top = `${originY + (Math.random() - .5) * 1.2}%`;
      seed.style.setProperty("--seed-dx", `${15 + Math.random() * 25}vw`);
      seed.style.setProperty("--seed-dy", `${-16 - Math.random() * 22}vh`);
      seed.style.setProperty("--seed-wander", `${-2 + Math.random() * 8}vw`);
      seed.style.setProperty("--seed-rotate", `${-45 + Math.random() * 115}deg`);
      seed.style.setProperty("--seed-delay", `${index * 90 + Math.random() * 210}ms`);
      seed.style.setProperty("--seed-duration", `${4400 + Math.random() * 2100}ms`);
      seed.style.setProperty("--seed-scale", `${.72 + Math.random() * .34}`);
      root.appendChild(seed);
      seed.addEventListener("animationend", () => seed.remove(), { once: true });
    }
  }

  function createRipple(position) {
    for (let i = 0; i < 2; i += 1) {
      const material = new THREE.MeshBasicMaterial({ color: 0xc3d6d1, transparent: true, opacity: 0.46 - i * 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.078, 72), material);
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(position).setY(0.235);
      ring.userData.born = performance.now() + i * 170;
      rippleGroup.add(ring);
    }
  }

  const lightState = { progress: document.documentElement.dataset.light === "night" ? 0 : 1, target: document.documentElement.dataset.light === "night" ? 0 : 1 };

  function animate() {
    const elapsed = clock.getElapsedTime();
    const now = performance.now();
    lightState.progress += (lightState.target - lightState.progress) * 0.018;
    updateLighting(lightState.progress, elapsed);

    if (cameraJourney.active) {
      const raw = Math.min(1, (now - cameraJourney.start) / cameraJourney.duration);
      const t = smooth(raw);
      camera.position.copy(cameraJourney.positionCurve.getPoint(t));
      cameraTarget.copy(cameraJourney.targetCurve.getPoint(t));
      camera.fov = THREE.MathUtils.lerp(cameraJourney.fromFov, cameraJourney.toFov, t);
      camera.updateProjectionMatrix();
      if (raw >= 1) cameraJourney.active = false;
    }
    pointerDrift.lerp(desiredDrift, 0.02);
    const lookTarget = cameraTarget.clone().add(new THREE.Vector3(pointerDrift.x * 0.18, -pointerDrift.y * 0.1, 0));
    camera.lookAt(lookTarget);

    water.material.uniforms.time.value += 1 / 92;
    windEnergy *= 0.985;
    const naturalWind = 0.34 + Math.sin(elapsed * 0.38) * 0.11 + windEnergy;
    plantSway.forEach((plant, index) => {
      if (!plant.userData.baseRotation) plant.userData.baseRotation = plant.rotation.clone();
      plant.rotation.z = plant.userData.baseRotation.z + Math.sin(elapsed * (0.42 + index % 4 * 0.04) + index) * 0.012 * naturalWind;
    });
    if (treeRoot) treeRoot.rotation.z = Math.sin(elapsed * 0.16) * 0.0019 * naturalWind;
    dandelions?.update(elapsed, naturalWind, camera);
    updateBird(bird, now, elapsed);
    if (bird?.userData?.isSprite) bird.quaternion.copy(camera.quaternion);
    fireflies.update(elapsed, 1 - lightState.progress);

    rippleGroup.children.slice().forEach((ring) => {
      const age = Math.max(0, (now - ring.userData.born) / 2300);
      ring.visible = now >= ring.userData.born;
      ring.scale.setScalar(1 + age * 13);
      ring.material.opacity = Math.max(0, 0.46 * (1 - age));
      if (age > 1) { rippleGroup.remove(ring); ring.geometry.dispose(); ring.material.dispose(); }
    });
    dynamicStoneGroup.children.forEach((stone, index) => {
      if (stone.userData.arrivingAt) {
        const age = Math.min(1, (now - stone.userData.arrivingAt) / 1350);
        const t = 1 - Math.pow(1 - age, 3);
        stone.position.y = THREE.MathUtils.lerp(stone.userData.restY + 1.8, stone.userData.restY, t);
        stone.scale.copy(stone.userData.baseScale).multiplyScalar(Math.max(0.06, t));
        stone.rotation.z += 0.018 * (1 - t);
        if (age >= 1) stone.userData.arrivingAt = 0;
      }
      if (stone === guideStone && now > guideStarted) {
        const pulse = (Math.sin((now - guideStarted) / 360) + 1) * 0.5;
        stone.userData.glint.material.opacity = 0.04 + pulse * 0.15;
      } else if (stone.userData.glint) stone.userData.glint.material.opacity *= 0.94;
    });

    if (root.classList.contains("is-active")) renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function updateBird(birdObject, now, elapsed) {
    if (!birdObject) return;
    if (birdTimeline && now >= birdTimeline) {
      bird.visible = true;
      bird.userData.state = "arrive";
      bird.userData.stateAt = now;
      birdTimeline = 0;
      localStorage.setItem(BIRD_SEEN_KEY, "1");
      birdFirstVisit = false;
      window.dispatchEvent(new CustomEvent("yinyuan:bird-arrived"));
    }
    if (!bird.visible) return;
    const data = bird.userData;
    const stateAge = (now - data.stateAt) / 1000;
    if (data.state === "arrive") {
      data.setFrame?.(3);
      const t = smooth(Math.min(1, stateAge / 2.65));
      bird.position.copy(data.flightCurve.getPoint(t));
      bird.rotation.y = THREE.MathUtils.lerp(0.2, -0.72, t);
      const wingLeft = data.wingLeft || data.wings?.children[0];
      const wingRight = data.wingRight || data.wings?.children[1];
      if (wingLeft) wingLeft.rotation.z = Math.sin(stateAge * 26) * 0.72;
      if (wingRight) wingRight.rotation.z = -Math.sin(stateAge * 26) * 0.72;
      if (t >= 1) {
        data.state = "rest"; data.stateAt = now;
        [wingLeft, wingRight].filter(Boolean).forEach((wing) => { wing.rotation.z = 0; });
        data.nextActionAt = 4 + Math.random() * 3;
      }
    } else if (data.state === "rest") {
      data.setFrame?.(0);
      bird.position.copy(data.perch);
      bird.position.y += Math.sin(elapsed * 2.1) * 0.003;
      data.head.rotation.y = Math.sin(elapsed * 0.67) * 0.32 + Math.sin(elapsed * 1.83) * 0.09;
      data.head.rotation.z = Math.sin(elapsed * 0.51) * 0.075;
      if (stateAge > data.nextActionAt) {
        const choice = Math.random();
        data.state = choice < 0.44 ? "preen" : choice < 0.78 ? "hop" : "listen";
        data.stateAt = now;
      }
    } else if (data.state === "preen") {
      data.setFrame?.(2);
      bird.position.copy(data.perch);
      data.head.rotation.z = -0.86 + Math.sin(elapsed * 5.6) * 0.11;
      data.head.rotation.y = -0.52;
      if (data.wings) data.wings.rotation.y = Math.sin(elapsed * 3.8) * 0.045;
      if (data.wingLeft) data.wingLeft.rotation.y = Math.sin(elapsed * 3.8) * 0.055;
      if (stateAge > 1.8 + Math.random() * 0.7) { data.state = "rest"; data.stateAt = now; data.nextActionAt = 5 + Math.random() * 4; }
    } else if (data.state === "listen") {
      data.setFrame?.(1);
      bird.position.copy(data.perch);
      data.head.rotation.y = 0.5;
      data.head.rotation.z = 0.17;
      if (stateAge > 1.15) { data.state = "rest"; data.stateAt = now; data.nextActionAt = 3.5 + Math.random() * 3; }
    } else if (data.state === "hop") {
      data.setFrame?.(0);
      const t = Math.min(1, stateAge / 0.72);
      bird.position.lerpVectors(data.perch, data.hopPerch, smooth(t));
      bird.position.y += Math.sin(t * Math.PI) * 0.14;
      if (t >= 1) {
        const previous = data.perch;
        data.perch = data.hopPerch;
        data.hopPerch = previous;
        data.state = "rest";
        data.stateAt = now;
        data.nextActionAt = 4.5 + Math.random() * 4;
      }
    }
  }

  function updateLighting(day, elapsed) {
    const night = 1 - day;
    hemi.intensity = 0.35 + day * 1.3;
    hemi.color.set(day > 0.5 ? 0xd7ded3 : 0x617086);
    hemi.groundColor.set(day > 0.5 ? 0x1a2d24 : 0x091318);
    sun.intensity = 0.28 + day * 2.55;
    sun.color.set(day > 0.5 ? 0xf4ead0 : 0x95a2be);
    coolFill.intensity = 0.22 + day * 0.45;
    gardenLamp.intensity = night * 12;
    renderer.toneMappingExposure = 0.64 + day * 0.43;
    scene.fog.color.set(day > 0.5 ? 0xa7b3aa : 0x24323a);
    scene.fog.density = 0.0115 + night * 0.009 + Math.sin(elapsed * 0.035) * 0.0007;
    water.material.uniforms.waterColor.value.set(day > 0.5 ? 0x6f8985 : 0x263943);
    water.material.uniforms.sunColor.value.set(day > 0.5 ? 0xf0e2c6 : 0x94a8c2);
  }

  function onResize() {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.8));
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", onResize);
  const observer = new MutationObserver(() => {
    setMode(document.body.dataset.view || "entry");
    setLight(document.documentElement.dataset.light || "day");
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ["data-view"] });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-light"] });

  window.YinGarden3D = { available: true, setPlace, setLight, setMode, setTraces, addStone, focusTrace, windBurst };
  setMode(document.body.dataset.view || "entry");
  requestAnimationFrame(animate);
}

function pose(position, target, fov) { return { position: new THREE.Vector3(...position), target: new THREE.Vector3(...target), fov }; }
function smooth(t) { return t * t * (3 - 2 * t); }
function loadGltf(loader, url) { return new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject)); }
function loadTexture(loader, url, color = false) {
  return new Promise((resolve, reject) => loader.load(url, (texture) => {
    if (color) texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    resolve(texture);
  }, undefined, reject));
}

function createDepthBackplate(scene, texture, referencePose) {
  const columns = 96;
  const rows = 58;
  const viewportAspect = innerWidth / innerHeight;
  const imageAspect = (texture.image?.naturalWidth || texture.image?.width || 16) / (texture.image?.naturalHeight || texture.image?.height || 9);
  const extentX = Math.max(1, imageAspect / viewportAspect);
  const extentY = Math.max(1, viewportAspect / imageAspect);
  const reference = new THREE.PerspectiveCamera(referencePose.fov, viewportAspect, 0.08, 180);
  reference.position.copy(referencePose.position);
  reference.lookAt(referencePose.target);
  reference.updateMatrixWorld(true);
  reference.updateProjectionMatrix();
  const positions = [];
  const uvs = [];
  const indices = [];
  const sample = new THREE.Vector3();
  for (let row = 0; row <= rows; row += 1) {
    const v = row / rows;
    const ndcY = (v * 2 - 1) * extentY;
    for (let column = 0; column <= columns; column += 1) {
      const u = column / columns;
      const ndcX = (u * 2 - 1) * extentX;
      const bottom = Math.pow(1 - v, 2.25);
      const leftTree = Math.exp(-Math.pow((u - 0.12) / 0.22, 2)) * (0.38 + Math.pow(v, 1.25) * 0.62);
      const canopy = Math.exp(-Math.pow((u - 0.33) / 0.38, 2) - Math.pow((v - 0.88) / 0.24, 2)) * 0.7;
      const nearPath = Math.exp(-Math.pow((u - 0.34) / 0.22, 2)) * Math.pow(1 - v, 1.15) * 0.8;
      const water = Math.exp(-Math.pow((u - 0.72) / 0.34, 2)) * Math.pow(1 - v, 1.35) * 0.32;
      const nearness = Math.min(0.94, Math.max(bottom * 0.72, leftTree * 0.9, canopy, nearPath, water));
      const distance = 43 - nearness * 21;
      sample.set(ndcX, ndcY, 0.45).unproject(reference).sub(reference.position).normalize().multiplyScalar(distance).add(reference.position);
      positions.push(sample.x, sample.y, sample.z);
      uvs.push(u, v);
      if (column < columns && row < rows) {
        const a = row * (columns + 1) + column;
        indices.push(a, a + 1, a + columns + 1, a + 1, a + columns + 2, a + columns + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, fog: false, toneMapped: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "GardenDepthBackplate";
  mesh.renderOrder = -100;
  mesh.frustumCulled = false;
  scene.add(mesh);
  return mesh;
}

async function loadMaps(loader) {
  const load = (url, color = false) => new Promise((resolve, reject) => loader.load(url, (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.anisotropy = 8;
    if (color) texture.colorSpace = THREE.SRGBColorSpace;
    resolve(texture);
  }, undefined, reject));
  const base = "./assets/polyhaven/forest_leaves_02/";
  const [diffuse, normal, roughness] = await Promise.all([load(base + "diffuse.jpg", true), load(base + "normal.jpg"), load(base + "roughness.jpg")]);
  return { diffuse, normal, roughness };
}

function shapeMesh(points, material, y) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) => index ? shape.lineTo(x, -z) : shape.moveTo(x, -z));
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape, 16);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.receiveShadow = true;
  return mesh;
}

function riverEdgesAt(z) {
  const center = 9.15 + Math.sin((z + 8) * 0.047) * 0.78 + Math.sin((z - 2) * 0.115) * 0.2;
  const halfWidth = 4.18 + Math.sin(z * 0.061 + 0.8) * 0.42;
  return { left: center - halfWidth, right: center + halfWidth };
}

function terrainNoise(x, z) {
  return Math.sin(x * 0.58 + z * 0.11) * 0.055 + Math.sin(z * 0.37 - x * 0.17) * 0.035 + Math.cos((x + z) * 0.23) * 0.025;
}

function createBankGeometry(side) {
  const zSegments = 150;
  const xSegments = 18;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let zi = 0; zi <= zSegments; zi += 1) {
    const z = THREE.MathUtils.lerp(24, -74, zi / zSegments);
    const edge = riverEdgesAt(z)[side];
    const outer = side === "left" ? -28 : 29;
    for (let xi = 0; xi <= xSegments; xi += 1) {
      const t = xi / xSegments;
      const x = THREE.MathUtils.lerp(edge, outer, t);
      const bankRise = Math.pow(t, 1.65) * (side === "left" ? 1.16 : 0.82);
      const shoreShelf = Math.exp(-t * 10) * -0.03;
      const y = 0.03 + bankRise + terrainNoise(x, z) * (0.25 + t * 0.9) + shoreShelf;
      positions.push(x, y, z);
      uvs.push(t * 5.5, (zi / zSegments) * 16);
    }
  }
  for (let z = 0; z < zSegments; z += 1) {
    for (let x = 0; x < xSegments; x += 1) {
      const a = z * (xSegments + 1) + x;
      const b = a + 1;
      const c = a + xSegments + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createRiverGeometry() {
  const segments = 190;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= segments; i += 1) {
    const z = THREE.MathUtils.lerp(25, -78, i / segments);
    const edges = riverEdgesAt(z);
    positions.push(edges.left - 0.06, -z, 0, edges.right + 0.06, -z, 0);
    uvs.push(0, i / 13, 1, i / 13);
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createShallows() {
  const group = new THREE.Group();
  group.name = "ShallowRiverBedDetails";
  const palette = [0x495554, 0x59615d, 0x3f4c4c, 0x68706a];
  const materialPool = palette.map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0 }));
  const count = 34;
  for (let i = 0; i < count; i += 1) {
    const z = 4.1 - (i / (count - 1)) * 7.2 + Math.sin(i * 2.17) * 0.18;
    const edges = riverEdgesAt(z);
    const shoreBias = 0.1 + Math.pow(((i * 37) % 101) / 100, 1.7) * 0.52;
    const x = THREE.MathUtils.lerp(edges.left + 0.25, edges.right - 0.25, shoreBias);
    const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055 + (i % 7) * 0.011, 1), materialPool[i % materialPool.length]);
    stone.scale.set(1.2 + (i % 5) * 0.12, 0.28 + (i % 3) * 0.07, 0.8 + (i % 4) * 0.1);
    stone.position.set(x, -0.195 + (i % 3) * 0.008, z);
    stone.rotation.set(i * 0.23, i * 1.71, i * 0.13);
    stone.receiveShadow = true;
    group.add(stone);
  }
  return group;
}

function createReedBeds(world, swayList) {
  const group = new THREE.Group();
  group.name = "RiverEdgeReeds";
  group.visible = false;
  const geometry = new THREE.ConeGeometry(0.018, 0.72, 4, 1);
  geometry.translate(0, 0.36, 0);
  const materials = [
    new THREE.MeshStandardMaterial({ color: 0x526848, roughness: 0.98, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x667755, roughness: 0.98, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x455b43, roughness: 0.98, side: THREE.DoubleSide }),
  ];
  const beds = [[4.15, 8.8, 10], [4.35, 3.8, 12], [4.2, -2.6, 9], [13.85, 5.2, 7], [13.65, -1.6, 8]];
  beds.forEach(([baseX, baseZ, count], bedIndex) => {
    const clump = new THREE.Group();
    for (let i = 0; i < count; i += 1) {
      const blade = new THREE.Mesh(geometry, materials[(i + bedIndex) % materials.length]);
      const angle = i * 2.399 + bedIndex;
      const radius = 0.08 + ((i * 19) % 17) * 0.022;
      blade.position.set(baseX + Math.cos(angle) * radius, 0.02, baseZ + Math.sin(angle) * radius * 1.8);
      blade.scale.set(0.68 + (i % 5) * 0.1, 0.56 + (i % 7) * 0.09, 0.72);
      blade.rotation.z = (Math.sin(i * 1.7) * 0.08);
      blade.castShadow = true;
      clump.add(blade);
    }
    group.add(clump);
    swayList.push(clump);
  });
  world.add(group);
}

function createPath(material) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.9, 0.1, 18), new THREE.Vector3(-0.5, 0.1, 10), new THREE.Vector3(-0.1, 0.1, 5),
    new THREE.Vector3(-0.8, 0.1, 0), new THREE.Vector3(0.5, 0.1, -6), new THREE.Vector3(-0.2, 0.1, -22), new THREE.Vector3(0.1, 0.1, -62),
  ], false, "centripetal");
  const segments = 90;
  const vertices = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const width = THREE.MathUtils.lerp(1.55, 0.72, t) * (0.95 + Math.sin(i * 1.73) * 0.05);
    [point.clone().addScaledVector(side, width), point.clone().addScaledVector(side, -width)].forEach((vertex, sideIndex) => {
      vertex.y += Math.sin(i * 0.9 + sideIndex) * 0.012;
      vertices.push(vertex.x, vertex.y, vertex.z);
      uvs.push(sideIndex, t * 13);
    });
    if (i < segments) {
      const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function normalise(object, targetHeight) {
  object.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const scale = targetHeight / Math.max(size.y, 0.0001);
  object.scale.multiplyScalar(scale);
  object.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= box.min.y;
  return object;
}

function collectMeshes(root) { const meshes = []; root.traverse((item) => { if (item.isMesh) meshes.push(item); }); return meshes; }
function polish(root, { shadow = false } = {}) {
  root.traverse((item) => {
    if (!item.isMesh) return;
    item.castShadow = shadow;
    item.receiveShadow = true;
    const materials = Array.isArray(item.material) ? item.material : [item.material];
    materials.forEach((material) => {
      if (!material) return;
      material.roughness = Math.max(material.roughness ?? 0.8, 0.72);
      if (/leave|branch/i.test(material.name)) { material.side = THREE.DoubleSide; material.alphaTest = 0.35; }
    });
  });
}

function makeWaterNormals() {
  const size = 256;
  const c = document.createElement("canvas"); c.width = c.height = size;
  const ctx = c.getContext("2d"); const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const i = (y * size + x) * 4;
    const wave = Math.sin(x * 0.18 + Math.sin(y * 0.05) * 3) + Math.sin(y * 0.25 + x * 0.035) * 0.58;
    image.data[i] = 126 + wave * 16; image.data[i + 1] = 126 + Math.cos(y * 0.21 + x * 0.06) * 14; image.data[i + 2] = 242; image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(c); texture.wrapS = texture.wrapT = THREE.RepeatWrapping; return texture;
}

function createDandelionBillboard(world, atlas) {
  const group = new THREE.Group();
  group.name = "DandelionThreshold";
  group.position.set(-2.58, 0.045, 7.38);
  const material = new THREE.ShaderMaterial({
    uniforms: { atlas: { value: atlas }, opacity: { value: 0.94 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform sampler2D atlas;
      uniform float opacity;
      varying vec2 vUv;
      void main(){
        vec4 texel=texture2D(atlas,vUv);
        float hi=max(texel.r,max(texel.g,texel.b));
        float lo=min(texel.r,min(texel.g,texel.b));
        float neutral=1.0-smoothstep(0.03,0.18,hi-lo);
        float pale=smoothstep(0.54,0.84,lo);
        float alpha=(1.0-neutral*pale)*opacity;
        if(alpha<0.06) discard;
        gl_FragColor=vec4(texel.rgb,alpha);
      }`,
  });
  const plant = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.63), material);
  plant.position.y = 0.315;
  plant.renderOrder = 4;
  group.add(plant);
  world.add(group);
  const drifting = [];
  let lastRelease = -Infinity;
  return {
    group,
    release() {
      if (performance.now() - lastRelease < 4200) return;
      lastRelease = performance.now();
      const count = 3 + Math.floor(Math.random() * 5);
      for (let i = 0; i < count; i += 1) {
        const seed = makeFlyingSeed();
        seed.scale.setScalar(0.72 + Math.random() * 0.18);
        seed.position.copy(group.position).add(new THREE.Vector3(-0.12 + (Math.random() - 0.5) * 0.08, 0.56 + Math.random() * 0.05, (Math.random() - 0.5) * 0.06));
        seed.userData.velocity = new THREE.Vector3(0.0024 + Math.random() * 0.0022, 0.0008 + Math.random() * 0.0013, -0.001 + (Math.random() - 0.5) * 0.0018);
        seed.userData.life = 0;
        seed.userData.pause = 0.85 + Math.random() * 1.1;
        seed.userData.phase = Math.random() * Math.PI * 2;
        world.add(seed);
        drifting.push(seed);
      }
    },
    update(elapsed, wind, camera) {
      group.lookAt(camera.position.x, group.position.y + 0.28, camera.position.z);
      plant.rotation.z = Math.sin(elapsed * 0.66) * 0.012 * wind;
      drifting.slice().forEach((seed) => {
        seed.userData.life += 1 / 60;
        const moving = Math.max(0, seed.userData.life - seed.userData.pause);
        const drift = 0.14 + Math.min(1, moving * 0.7);
        seed.position.x += seed.userData.velocity.x * drift;
        seed.position.y += Math.sin(elapsed * 1.18 + seed.userData.phase) * 0.00075 + seed.userData.velocity.y * Math.min(1, moving);
        seed.position.z += Math.sin(elapsed * 0.72 + seed.userData.phase) * 0.001 + seed.userData.velocity.z;
        seed.rotation.y += 0.006;
        seed.rotation.z = Math.sin(elapsed * 0.82 + seed.userData.phase) * 0.17;
        if (seed.userData.life > 13) { world.remove(seed); drifting.splice(drifting.indexOf(seed), 1); }
      });
    },
  };
}

function createDandelionPatch(world, source, swayList) {
  const group = new THREE.Group();
  group.name = "DandelionThreshold";
  const variants = collectMeshes(source);
  const positions = [[-2.95, 0.04, 8.15], [-2.58, 0.04, 7.78], [-2.22, 0.04, 7.34], [-3.28, 0.04, 7.08], [-1.93, 0.04, 6.92], [-2.78, 0.04, 6.55], [-2.35, 0.04, 6.28]];
  positions.forEach((pos, index) => {
    const leaf = variants[index % variants.length].clone();
    leaf.material = leaf.material.clone(); leaf.material.side = THREE.DoubleSide; leaf.material.alphaTest = 0.35;
    normalise(leaf, 0.145 + (index % 3) * 0.022);
    leaf.position.set(...pos); leaf.rotation.y = index * 1.41;
    group.add(leaf); swayList.push(leaf);
  });
  const heads = [];
  [[-2.72, 7.92, 0.49, 0], [-2.23, 7.25, 0.42, 0.38]].forEach(([x, z, height, missing], index) => {
    const head = makeSeedHead(index === 0 ? 0.68 : 0.59, missing);
    head.position.set(x, 0.04, z); head.userData.baseRotation = head.rotation.clone();
    head.userData.phase = index * 1.8; group.add(head); heads.push(head);
  });
  const bud = makeDandelionBud();
  bud.position.set(-3.12, 0.04, 6.88);
  bud.rotation.z = -0.08;
  bud.scale.setScalar(0.72);
  group.add(bud);
  heads.push(bud);
  const drifting = [];
  let lastRelease = -Infinity;
  world.add(group);
  return {
    release() {
      if (performance.now() - lastRelease < 4200) return;
      lastRelease = performance.now();
      const sourceHead = heads[0];
      const count = 3 + Math.floor(Math.random() * 5);
      for (let i = 0; i < count; i += 1) {
        const seed = makeFlyingSeed(); seed.position.copy(sourceHead.position).add(new THREE.Vector3(0, 0.45, 0));
        seed.position.add(new THREE.Vector3((Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.05));
        seed.userData.velocity = new THREE.Vector3(0.003 + Math.random() * 0.003, 0.001 + Math.random() * 0.002, (Math.random() - 0.5) * 0.0025);
        seed.userData.life = 0;
        seed.userData.pause = 0.8 + Math.random() * 1.3;
        seed.userData.phase = Math.random() * Math.PI * 2;
        world.add(seed); drifting.push(seed);
      }
    },
    update(elapsed, wind) {
      heads.forEach((head) => { head.rotation.z = Math.sin(elapsed * 0.72 + head.userData.phase) * 0.045 * wind; });
      drifting.slice().forEach((seed) => {
        seed.userData.life += 1 / 60;
        const moving = Math.max(0, seed.userData.life - seed.userData.pause);
        seed.position.x += seed.userData.velocity.x * (0.18 + Math.min(1, moving * 0.7));
        seed.position.y += Math.sin(elapsed * 1.25 + seed.userData.phase) * 0.0008 + seed.userData.velocity.y * Math.max(0, Math.min(1, moving));
        seed.position.z += Math.sin(elapsed * 0.7 + seed.userData.phase) * 0.0013 + seed.userData.velocity.z;
        seed.userData.velocity.x += 0.000018 * wind;
        seed.rotation.y += 0.006;
        seed.rotation.z = Math.sin(elapsed * 0.8 + seed.userData.phase) * 0.18;
        if (seed.userData.life > 13) { world.remove(seed); drifting.splice(drifting.indexOf(seed), 1); }
      });
    },
  };
}

function makeSeedHead(scale = 1, missing = 0) {
  const group = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.42, 7), new THREE.MeshStandardMaterial({ color: 0x617f50, roughness: 1 }));
  stem.position.y = 0.21; group.add(stem);
  const lines = [];
  const tips = [];
  const count = 74;
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = Math.PI * (3 - Math.sqrt(5)) * i;
    const missingSide = Math.cos(theta) > 0.12 && y > -0.45;
    if (missing && missingSide && (i % 11) / 11 < missing) continue;
    const tip = new THREE.Vector3(Math.cos(theta) * radius * 0.126, 0.45 + y * 0.126, Math.sin(theta) * radius * 0.126);
    const hub = new THREE.Vector3(0, 0.445, 0);
    lines.push(hub.x, hub.y, hub.z, tip.x, tip.y, tip.z);
    const tangentA = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta)).multiplyScalar(0.018);
    const tangentB = tip.clone().sub(hub).normalize().cross(tangentA).normalize().multiplyScalar(0.014);
    for (let spoke = 0; spoke < 4; spoke += 1) {
      const a = spoke * Math.PI * 0.5;
      const end = tip.clone().add(tangentA.clone().multiplyScalar(Math.cos(a))).add(tangentB.clone().multiplyScalar(Math.sin(a)));
      lines.push(tip.x, tip.y, tip.z, end.x, end.y, end.z);
    }
    tips.push(tip.x, tip.y, tip.z);
  }
  const lineGeometry = new THREE.BufferGeometry(); lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  group.add(new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ color: 0xece7d7, transparent: true, opacity: 0.78, depthWrite: false })));
  const tipGeometry = new THREE.BufferGeometry(); tipGeometry.setAttribute("position", new THREE.Float32BufferAttribute(tips, 3));
  group.add(new THREE.Points(tipGeometry, new THREE.PointsMaterial({ color: 0xf5f0df, size: 0.012, transparent: true, opacity: 0.72, depthWrite: false })));
  group.scale.setScalar(scale);
  group.userData.phase = Math.random() * Math.PI * 2;
  return group;
}

function makeDandelionBud() {
  const group = new THREE.Group();
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x587348, roughness: 1 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.011, 0.32, 7), stemMaterial);
  stem.position.y = 0.16;
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 9), new THREE.MeshStandardMaterial({ color: 0x728055, roughness: 0.96 }));
  bud.scale.set(0.75, 1.2, 0.75);
  bud.position.y = 0.34;
  group.add(stem, bud);
  group.userData.phase = 3.4;
  return group;
}

function makeFlyingSeed() {
  const group = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0014, 0.074, 4), new THREE.MeshBasicMaterial({ color: 0x8f8065 })); stem.position.y = -0.036; group.add(stem);
  const lines = [];
  for (let i = 0; i < 12; i += 1) {
    const angle = i / 12 * Math.PI * 2;
    lines.push(0, 0, 0, Math.cos(angle) * 0.029, 0.012 + (i % 2) * 0.004, Math.sin(angle) * 0.029);
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  group.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xf2eee3, transparent: true, opacity: 0.76, depthWrite: false })));
  return group;
}

function createRootSeat(world) {
  const group = new THREE.Group();
  group.name = "TreeRootSeat";
  group.position.set(-4.08, 0.16, 7.48);
  group.rotation.y = -0.18;

  const geometry = new THREE.CylinderGeometry(0.42, 0.47, 2.18, 22, 12, false);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const base = new THREE.Color(0x4b4034);
  const tint = new THREE.Color();
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const barkNoise = 1 + Math.sin(y * 8.4 + z * 6.3) * 0.045 + Math.cos(y * 15.2 - z * 4.1) * 0.022;
    const flattened = x > 0.08 ? 0.11 + (x - 0.08) * 0.33 : x * 0.78;
    position.setXYZ(i, flattened, y, z * 0.9 * barkNoise);
    tint.copy(base).offsetHSL(0.01, -0.03, Math.sin(y * 18 + z * 11) * 0.052 + x * 0.025);
    colors[i * 3] = tint.r; colors[i * 3 + 1] = tint.g; colors[i * 3 + 2] = tint.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: 0x8b7d69,
    vertexColors: true,
    roughness: 0.98,
    metalness: 0,
  });
  const log = new THREE.Mesh(geometry, material);
  log.rotation.z = Math.PI / 2;
  log.rotation.x = 0.06;
  log.castShadow = true;
  log.receiveShadow = true;
  group.add(log);

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ color: 0x0a1511, transparent: true, opacity: 0.34, depthWrite: false, side: THREE.DoubleSide }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.16, 0.4, 1);
  shadow.position.y = -0.16;
  group.add(shadow);

  const mossMaterial = new THREE.MeshStandardMaterial({ color: 0x42523d, roughness: 1 });
  [[-0.88, 0.29, 0.22, 0.2], [0.83, 0.3, -0.2, 0.16], [-0.42, 0.31, -0.29, 0.11]].forEach(([x, y, z, scale], index) => {
    const moss = new THREE.Mesh(new THREE.SphereGeometry(scale, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.48), mossMaterial);
    moss.scale.set(1.35, 0.14, 0.74);
    moss.position.set(x, y, z);
    moss.rotation.y = index * 1.4;
    group.add(moss);
  });
  world.add(group);
  return group;
}

function createNest(world) {
  const bark = new THREE.MeshStandardMaterial({ color: 0x302b22, roughness: 1 });
  const branchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-5.15, 5.48, 3.35),
    new THREE.Vector3(-4.18, 5.4, 3.04),
    new THREE.Vector3(-3.14, 5.27, 2.72),
    new THREE.Vector3(-1.96, 5.18, 2.43),
  ]);
  const branch = new THREE.Mesh(new THREE.TubeGeometry(branchCurve, 28, 0.055, 8, false), bark);
  branch.castShadow = true;
  branch.visible = false;
  world.add(branch);
  const fork = cylinderBetween(new THREE.Vector3(-3.48, 5.31, 2.82), new THREE.Vector3(-2.94, 5.68, 2.57), 0.029, bark);
  fork.visible = false;
  world.add(fork);
  const nest = new THREE.Group();
  nest.name = "WhiteEyeNest";
  nest.position.set(-3.18, 3.82, 2.69);
  nest.rotation.set(0.04, 0.24, -0.1);
  const twigMaterials = [0x574331, 0x74624b, 0x89765a].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  for (let i = 0; i < 46; i += 1) {
    const angle = i * 2.399;
    const level = (i % 9) / 9;
    const radius = 0.11 + level * 0.115;
    const center = new THREE.Vector3(Math.cos(angle) * radius * 0.36, level * 0.13, Math.sin(angle) * radius * 0.36);
    const tangent = new THREE.Vector3(-Math.sin(angle), (i % 3 - 1) * 0.09, Math.cos(angle)).normalize();
    const half = 0.13 + (i % 5) * 0.015;
    const twig = cylinderBetween(center.clone().addScaledVector(tangent, -half), center.clone().addScaledVector(tangent, half), 0.004 + (i % 3) * 0.0015, twigMaterials[i % twigMaterials.length]);
    nest.add(twig);
  }
  const fibre = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: 0x80735c, roughness: 1, side: THREE.DoubleSide }));
  fibre.scale.set(1.3, 0.52, 1.05);
  fibre.position.y = 0.06;
  nest.add(fibre);
  world.add(nest);
}

function createWhiteEye(world, source = null) {
  if (source?.isTexture) {
    const uniforms = {
      atlas: { value: source },
      atlasOffset: { value: new THREE.Vector2(0, 0.5) },
      opacity: { value: 0.96 },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform sampler2D atlas;
        uniform vec2 atlasOffset;
        uniform float opacity;
        varying vec2 vUv;
        void main(){
          vec4 texel=texture2D(atlas, vUv*0.5+atlasOffset);
          float hi=max(texel.r,max(texel.g,texel.b));
          float lo=min(texel.r,min(texel.g,texel.b));
          float neutral=1.0-smoothstep(0.025,0.19,hi-lo);
          float pale=smoothstep(0.42,0.66,lo);
          float alpha=(1.0-neutral*pale)*opacity;
          if(alpha<0.15) discard;
          gl_FragColor=vec4(texel.rgb,alpha);
        }`,
    });
    const bird = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), material);
    bird.name = "JapaneseWhiteEye";
    const perch = new THREE.Vector3(-3.48, 4.92, 2.63);
    bird.position.copy(perch);
    bird.visible = false;
    bird.renderOrder = 5;
    bird.userData = {
      isSprite: true,
      state: "rest", stateAt: performance.now(), head: bird, perch,
      hopPerch: perch.clone().add(new THREE.Vector3(0.34, 0.04, -0.08)),
      nextActionAt: 4.2 + Math.random() * 2.8,
      flightCurve: new THREE.CatmullRomCurve3([new THREE.Vector3(12, 7.8, -13), new THREE.Vector3(3.2, 8.7, -3.4), new THREE.Vector3(-0.8, 6.8, 0.8), perch], false, "centripetal"),
      setFrame(frame) {
        const frames = [[0, 0.5], [0.5, 0.5], [0, 0], [0.5, 0]];
        uniforms.atlasOffset.value.set(...frames[frame] || frames[0]);
      },
    };
    world.add(bird);
    return bird;
  }
  const bird = new THREE.Group();
  bird.name = "JapaneseWhiteEye";
  const feather = new THREE.MeshStandardMaterial({ color: 0x71864b, roughness: 0.9, metalness: 0 });
  const olive = new THREE.MeshStandardMaterial({ color: 0x53643d, roughness: 0.94 });
  const belly = new THREE.MeshStandardMaterial({ color: 0xc8c49e, roughness: 0.96 });
  const throat = new THREE.MeshStandardMaterial({ color: 0xa8a76f, roughness: 0.96 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x151a15, roughness: 0.84 });
  const white = new THREE.MeshStandardMaterial({ color: 0xe8e6d7, roughness: 0.92 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.185, 32, 22), feather);
  body.scale.set(0.82, 0.96, 1.38); body.rotation.x = -0.14; bird.add(body);
  const bellyPatch = new THREE.Mesh(new THREE.SphereGeometry(0.158, 28, 18, 0, Math.PI * 2, Math.PI * 0.33, Math.PI * 0.58), belly);
  bellyPatch.position.set(0, -0.075, -0.015); bellyPatch.rotation.x = Math.PI * 0.82; bellyPatch.scale.set(0.78, 0.54, 1.12); bird.add(bellyPatch);
  const throatPatch = new THREE.Mesh(new THREE.SphereGeometry(0.12, 22, 16), throat);
  throatPatch.position.set(0, 0.035, -0.175); throatPatch.scale.set(0.7, 0.62, 0.55); bird.add(throatPatch);
  const head = new THREE.Group(); head.position.set(0, 0.145, -0.175); bird.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.142, 30, 22), feather); skull.scale.set(0.94, 1.02, 1.02); head.add(skull);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.17, 12), dark); beak.rotation.x = -Math.PI / 2; beak.position.z = -0.185; head.add(beak);
  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.017, 14, 10), dark); eye.position.set(side * 0.119, 0.035, -0.064); head.add(eye);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.0065, 10, 26), white); ring.position.set(side * 0.123, 0.035, -0.066); ring.rotation.y = Math.PI / 2; head.add(ring);
  });
  const wings = new THREE.Group(); bird.add(wings);
  [-1, 1].forEach((side) => {
    const wingGroup = new THREE.Group();
    wingGroup.position.set(side * 0.15, 0.015, 0.02);
    for (let i = 0; i < 6; i += 1) {
      const wing = new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 12), i < 2 ? feather : olive);
      wing.scale.set(0.26, 0.47 + i * 0.025, 1.05 + i * 0.07);
      wing.position.set(side * (i * 0.004), -i * 0.012, 0.018 + i * 0.027);
      wing.rotation.z = side * (0.24 + i * 0.015);
      wingGroup.add(wing);
    }
    wings.add(wingGroup);
  });
  [-1, 0, 1].forEach((side) => {
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.22 + Math.abs(side) * 0.025, 5, 9), olive);
    tail.scale.set(0.5, 1, 0.44); tail.rotation.x = Math.PI / 2; tail.rotation.z = side * 0.06; tail.position.set(side * 0.041, -0.035, 0.3); bird.add(tail);
  });
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x5e5543, roughness: 0.95 });
  [-1, 1].forEach((side) => {
    const leg = cylinderBetween(new THREE.Vector3(side * 0.055, -0.16, -0.005), new THREE.Vector3(side * 0.052, -0.25, 0.015), 0.006, legMaterial);
    bird.add(leg);
    [-1, 1].forEach((toeSide) => bird.add(cylinderBetween(new THREE.Vector3(side * 0.052, -0.25, 0.015), new THREE.Vector3(side * 0.052 + toeSide * 0.025, -0.258, 0.065), 0.003, legMaterial)));
  });
  const perch = new THREE.Vector3(-4.18, 5.73, 2.56);
  bird.position.copy(perch); bird.scale.setScalar(0.92); bird.rotation.y = -0.72; bird.visible = false;
  bird.userData = {
    state: "rest", stateAt: performance.now(), head, wings, perch,
    hopPerch: perch.clone().add(new THREE.Vector3(0.38, 0.045, -0.1)),
    nextActionAt: 4.2 + Math.random() * 2.8,
    flightCurve: new THREE.CatmullRomCurve3([new THREE.Vector3(12, 7.8, -13), new THREE.Vector3(3.2, 8.7, -3.4), new THREE.Vector3(-1.7, 7.1, 0.8), perch], false, "centripetal"),
  };
  bird.traverse((item) => { if (item.isMesh) item.castShadow = true; }); world.add(bird); return bird;
}

function cylinderBetween(start, end, radius, material) {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.78, radius, direction.length(), 8), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  mesh.castShadow = true;
  return mesh;
}

function makeMemoryStone(trace, index, textureMaterial) {
  const group = new THREE.Group(); group.userData.trace = trace;
  const geometry = textureMaterial?.isMesh ? textureMaterial.geometry.clone() : new THREE.IcosahedronGeometry(0.105, 3);
  geometry.computeBoundingBox();
  if (geometry.boundingBox) {
    const size = geometry.boundingBox.getSize(new THREE.Vector3());
    const scale = 0.21 / Math.max(size.x, size.y, size.z, 0.001);
    geometry.center();
    geometry.scale(scale, scale, scale);
  }
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const coarse = Math.sin((x + index) * 8.7) * Math.cos((z - index) * 10.9) * 0.065;
    const fine = Math.sin((x + y + z) * 21 + index) * 0.018;
    const noise = 1 + coarse + fine;
    position.setXYZ(i, x * noise, y * noise, z * noise);
  }
  const colorAttribute = new Float32Array(position.count * 3);
  const stoneColor = new THREE.Color(index % 3 === 0 ? 0x7f9598 : index % 3 === 1 ? 0x708990 : 0x899d9e);
  const vertexColor = new THREE.Color();
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const mottling = Math.sin(x * 41 + index * 1.7) * Math.cos(z * 37 - y * 29) * 0.055 + y * 0.18;
    vertexColor.copy(stoneColor).offsetHSL(0, -0.025, mottling);
    colorAttribute[i * 3] = vertexColor.r;
    colorAttribute[i * 3 + 1] = vertexColor.g;
    colorAttribute[i * 3 + 2] = vertexColor.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colorAttribute, 3));
  geometry.computeVertexNormals();
  const base = new THREE.MeshPhysicalMaterial({
    color: 0xc4cecb,
    vertexColors: true,
    emissive: 0x233638,
    emissiveIntensity: 0.22,
    roughness: 0.76,
    metalness: 0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.68,
  });
  const stone = new THREE.Mesh(geometry, base);
  stone.name = `MemoryStone_${trace.id}`; stone.scale.set(0.72 + index % 3 * 0.05, 0.38 + index % 2 * 0.04, 0.9 - index % 3 * 0.045);
  stone.rotation.set((index % 4 - 2) * 0.08, index * 1.17, (index % 3 - 1) * 0.09);
  stone.castShadow = stone.receiveShadow = true; group.add(stone); group.userData.core = stone;
  if (index < 7) {
    const shoalOffsets = [[0, 0], [0.46, -0.24], [0.92, 0.1], [0.24, -0.68], [0.73, -0.81], [1.18, -0.51], [0.02, -1.1]];
    const [offsetX, offsetZ] = shoalOffsets[index];
    group.position.set(7.05 + offsetX, 0.19 - (index % 3) * 0.006, -2.2 + offsetZ);
  } else {
    const clusterIndex = index - 7;
    const angle = clusterIndex * 2.399;
    const radius = 0.22 + Math.sqrt(clusterIndex + 1) * 0.13;
    group.position.set(8.25 + Math.cos(angle) * radius, 0.185, -3.25 + Math.sin(angle) * radius * 0.68);
    stone.scale.multiplyScalar(0.84 + (clusterIndex % 4) * 0.035);
  }
  const contact = new THREE.Mesh(new THREE.CircleGeometry(0.105, 40), new THREE.MeshBasicMaterial({ color: 0x142c2c, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }));
  contact.rotation.x = -Math.PI / 2; contact.scale.set(1.15, 0.66, 1); contact.position.y = -0.042; group.add(contact);
  const glint = new THREE.Mesh(new THREE.RingGeometry(0.105, 0.113, 48), new THREE.MeshBasicMaterial({ color: 0xb9d6dd, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  glint.rotation.x = -Math.PI / 2; glint.position.y = 0.04; group.add(glint); group.userData.glint = glint;
  const waterline = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.112, 48), new THREE.MeshBasicMaterial({ color: 0x8faead, transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false }));
  waterline.rotation.x = -Math.PI / 2; waterline.position.y = -0.015; waterline.scale.set(1.3, 0.68, 1); group.add(waterline);
  const proxy = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); proxy.userData.trace = trace; group.add(proxy);
  return group;
}

function findTrace(object) { let node = object; while (node) { if (node.userData?.trace) return node.userData.trace; node = node.parent; } return null; }
function createFireflies(world) {
  return { update() {} };
}

function readTraces() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
