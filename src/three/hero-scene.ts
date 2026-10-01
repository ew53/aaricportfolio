import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  ConeGeometry,
  PlaneGeometry,
  BufferGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Mesh,
  LineBasicMaterial,
  WireframeGeometry,
  LineSegments,
  Line,
  AmbientLight,
  DirectionalLight,
  Color,
  Fog,
  GridHelper,
  Vector3,
} from "three";

const ACCENT = 0x3454d1;
const INK = 0x14161c;
const BG = 0xeef1f7;
const LINE = 0xc7cddb;
const LINE_STRONG = 0x9aa3ba;
const WATER = 0xb9d3ea;

const BOUND = 32;
const EYE_HEIGHT = 5.3;
const CAM_BACK = 8.5;
const ACCEL = 0.05;
const MAX_SPEED = 0.17;
const FRICTION = 0.86;

const RIVER_Z = 0;
const RIVER_HALF = 3.2;
const CELL = 5;

type Dir = "up" | "down" | "left" | "right";

// Deterministic PRNG so the city layout is stable across reloads.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface HeroSceneController {
  destroy: () => void;
  setDirection: (dir: Dir, active: boolean) => void;
  onFirstMove: (cb: () => void) => void;
}

export function initHeroScene(canvas: HTMLCanvasElement): HeroSceneController {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const scene = new Scene();
  scene.fog = new Fog(BG, 16, 40);

  const camera = new PerspectiveCamera(45, 1, 0.1, 100);

  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const disposables: { geometry: BufferGeometry; material: { dispose: () => void } }[] = [];

  // ---------- Ground grid (streets) ----------
  const grid = new GridHelper(BOUND * 2, Math.round((BOUND * 2) / CELL), LINE_STRONG, LINE);
  const gridMat = grid.material as LineBasicMaterial;
  gridMat.transparent = true;
  gridMat.opacity = 0.5;
  scene.add(grid);

  // ---------- Sarawak River, splitting the city into two banks ----------
  const riverGeo = new PlaneGeometry(BOUND * 2.2, RIVER_HALF * 2);
  const riverMat = new MeshBasicMaterial({ color: new Color(WATER), transparent: true, opacity: 0.55 });
  const river = new Mesh(riverGeo, riverMat);
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, 0.02, RIVER_Z);
  scene.add(river);
  disposables.push({ geometry: riverGeo, material: riverMat });

  // ---------- Lights ----------
  const ambient = new AmbientLight(0xffffff, 0.95);
  scene.add(ambient);
  const dir = new DirectionalLight(0xffffff, 0.55);
  dir.position.set(4, 8, 5);
  scene.add(dir);

  // ---------- Shared builder: wireframe + soft filled core ----------
  function addLandmark(
    geo: BufferGeometry,
    pos: [number, number, number],
    opts: { color?: number; opacity?: number; withCore?: boolean; rotY?: number } = {}
  ) {
    const wireGeo = new WireframeGeometry(geo);
    const wireMat = new LineBasicMaterial({
      color: new Color(opts.color ?? ACCENT),
      transparent: true,
      opacity: opts.opacity ?? 0.4,
    });
    const wire = new LineSegments(wireGeo, wireMat);
    wire.position.set(...pos);
    if (opts.rotY) wire.rotation.y = opts.rotY;
    scene.add(wire);
    disposables.push({ geometry: wireGeo, material: wireMat });

    if (opts.withCore !== false) {
      const coreMat = new MeshStandardMaterial({
        color: new Color(INK),
        transparent: true,
        opacity: 0.05,
        roughness: 0.5,
        metalness: 0.05,
        flatShading: true,
      });
      const core = new Mesh(geo, coreMat);
      core.position.copy(wire.position);
      core.rotation.copy(wire.rotation);
      scene.add(core);
      disposables.push({ geometry: geo, material: coreMat });
    } else {
      geo.dispose();
    }
    return wire;
  }

  const rand = mulberry32(1337);
  const reserved: [number, number, number][] = []; // x, z, clearance radius

  // ---------- Landmark: Darul Hana-style bridge across the river ----------
  {
    const pylonGeo = () => new BoxGeometry(0.35, 5.4, 0.35);
    const p1 = addLandmark(pylonGeo(), [0, 2.7, -RIVER_HALF], { opacity: 0.55 });
    const p2 = addLandmark(pylonGeo(), [0, 2.7, RIVER_HALF], { opacity: 0.55 });

    const deckGeo = new BoxGeometry(2.2, 0.22, RIVER_HALF * 2 + 1.2);
    addLandmark(deckGeo, [0, 0.2, RIVER_Z], { opacity: 0.4 });

    // suspension cables
    const cableMat = new LineBasicMaterial({ color: new Color(ACCENT), transparent: true, opacity: 0.35 });
    [p1, p2].forEach((pylon) => {
      for (const side of [-1, 1]) {
        const top = new Vector3(pylon.position.x, pylon.position.y + 2.5, pylon.position.z);
        const end = new Vector3(pylon.position.x + side * 1.1, 0.3, pylon.position.z + side * 2.6);
        const g = new BufferGeometry().setFromPoints([top, end]);
        const line = new Line(g, cableMat);
        scene.add(line);
        disposables.push({ geometry: g, material: cableMat });
      }
    });
    reserved.push([0, RIVER_Z, 3.5]);
  }

  // ---------- Landmark: Sarawak State Legislative Assembly (DUN) — umbrella roof ----------
  {
    const dunX = -9;
    const dunZ = -10;
    const baseGeo = new CylinderGeometry(1.3, 1.5, 2.4, 16);
    addLandmark(baseGeo, [dunX, 1.2, dunZ], { opacity: 0.45 });

    const roofGeo = new CylinderGeometry(3.4, 0.2, 1.1, 24);
    addLandmark(roofGeo, [dunX, 2.95, dunZ], { color: ACCENT, opacity: 0.7 });

    reserved.push([dunX, dunZ, 4.5]);
  }

  // ---------- Landmark: small cat statue (Kuching = "Cat City") ----------
  {
    const catX = 3;
    const catZ = 8;
    const plinthGeo = new BoxGeometry(0.9, 0.3, 0.9);
    addLandmark(plinthGeo, [catX, 0.15, catZ], { opacity: 0.4 });

    const bodyGeo = new SphereGeometry(0.5, 10, 8);
    const body = addLandmark(bodyGeo, [catX, 0.85, catZ], { opacity: 0.55 });
    body.scale.set(1, 1.3, 1.6);

    const headGeo = new SphereGeometry(0.32, 10, 8);
    addLandmark(headGeo, [catX, 1.5, catZ + 0.55], { opacity: 0.55 });

    const earGeo = () => new ConeGeometry(0.12, 0.26, 4);
    addLandmark(earGeo(), [catX - 0.18, 1.82, catZ + 0.5], { opacity: 0.5 });
    addLandmark(earGeo(), [catX + 0.18, 1.82, catZ + 0.5], { opacity: 0.5 });

    reserved.push([catX, catZ, 2.2]);
  }

  // ---------- Generic city blocks filling the rest of the grid ----------
  const half = Math.floor((BOUND - 4) / CELL);
  for (let gx = -half; gx <= half; gx++) {
    for (let gz = -half; gz <= half; gz++) {
      const x = gx * CELL + (rand() - 0.5) * 1.2;
      const z = gz * CELL + (rand() - 0.5) * 1.2;

      if (Math.abs(z - RIVER_Z) < RIVER_HALF + 1.4) continue;
      if (Math.hypot(x, z) < 3) continue;
      if (Math.hypot(x, z - 10) < 6) continue; // clear space around the walker's start

      const tooClose = reserved.some(([rx, rz, rr]) => Math.hypot(x - rx, z - rz) < rr);
      if (tooClose) continue;

      if (rand() < 0.4) continue; // leave open plazas/gaps

      const w = 1.1 + rand() * 0.9;
      const d = 1.1 + rand() * 0.9;
      const h = 1 + rand() * 3.2;

      const geo = new BoxGeometry(w, h, d);
      addLandmark(geo, [x, h / 2, z], {
        color: rand() > 0.85 ? INK : ACCENT,
        opacity: 0.16 + rand() * 0.22,
      });
    }
  }

  // ---------- Walker state (camera drifts as an isometric "you") ----------
  const walker = new Vector3(0, 0, 10);
  const velocity = new Vector3(0, 0, 0);
  const keys: Record<Dir, boolean> = { up: false, down: false, left: false, right: false };
  let hasMoved = false;
  let firstMoveCb: (() => void) | null = null;

  function isTypingTarget(el: EventTarget | null) {
    const tag = (el as HTMLElement | null)?.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  let heroVisible = true;

  const keyMap: Record<string, Dir> = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
  };

  function onKeyDown(e: KeyboardEvent) {
    if (!heroVisible || isTypingTarget(document.activeElement)) return;
    const d = keyMap[e.key];
    if (!d) return;
    if (e.key.startsWith("Arrow")) e.preventDefault();
    keys[d] = true;
    if (!hasMoved) {
      hasMoved = true;
      firstMoveCb?.();
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    const d = keyMap[e.key];
    if (d) keys[d] = false;
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  function setDirection(d: Dir, active: boolean) {
    keys[d] = active;
    if (active && !hasMoved) {
      hasMoved = true;
      firstMoveCb?.();
    }
  }

  // ---------- Hold-and-drag to look around (changes facing direction) ----------
  // Arrow keys/D-pad then walk relative to whichever way you're currently facing.
  const heroSection = canvas.parentElement ?? canvas;
  const YAW_SPEED = 0.0045;
  const PITCH_SPEED = 0.0028;
  const PITCH_MIN = -0.3;
  const PITCH_MAX = 0.3;
  let yaw = 0;
  let pitch = 0;
  let dragActive = false;
  let lastDragX = 0;
  let lastDragY = 0;

  function isInteractiveTarget(el: EventTarget | null) {
    return !!(el as HTMLElement | null)?.closest?.("a, button");
  }

  function onHeroPointerDown(e: PointerEvent) {
    // Touch/pen keep native scroll gestures; only mouse looks around
    // (touch devices get the on-screen D-pad for movement instead).
    if (e.pointerType !== "mouse") return;
    if (isInteractiveTarget(e.target)) return;
    dragActive = true;
    lastDragX = e.clientX;
    lastDragY = e.clientY;
    heroSection.classList.add("is-steering");
    try {
      (heroSection as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    if (!hasMoved) {
      hasMoved = true;
      firstMoveCb?.();
    }
  }

  function onHeroPointerMove(e: PointerEvent) {
    if (!dragActive) return;
    const dx = e.clientX - lastDragX;
    const dy = e.clientY - lastDragY;
    lastDragX = e.clientX;
    lastDragY = e.clientY;
    yaw += dx * YAW_SPEED;
    pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch - dy * PITCH_SPEED));
  }

  function endHeroDrag() {
    dragActive = false;
    heroSection.classList.remove("is-steering");
  }

  heroSection.addEventListener("pointerdown", onHeroPointerDown as EventListener);
  heroSection.addEventListener("pointermove", onHeroPointerMove as EventListener);
  heroSection.addEventListener("pointerup", endHeroDrag);
  heroSection.addEventListener("pointercancel", endHeroDrag);
  heroSection.addEventListener("pointerleave", endHeroDrag);

  // ---------- Subtle mouse parallax layered on top of walking ----------
  let targetOffsetX = 0;
  let targetOffsetY = 0;
  let currentOffsetX = 0;
  let currentOffsetY = 0;

  function onPointerMove(e: PointerEvent) {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetOffsetX = nx * 0.8;
    targetOffsetY = ny * 0.4;
  }
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 1);
    const h = Math.max(rect.height, 1);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  const io = new IntersectionObserver(
    (entries) => {
      heroVisible = entries[0]?.isIntersecting ?? true;
    },
    { threshold: 0 }
  );
  io.observe(canvas);

  let raf = 0;

  function updateWalker() {
    // Movement is relative to the current facing (yaw): "up" always walks
    // the way you're currently looking, "left"/"right" strafe around it.
    let dirUp = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
    let dirSide = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);

    const len = Math.hypot(dirUp, dirSide);
    if (len > 1) {
      dirUp /= len;
      dirSide /= len;
    }

    const fwd = { x: Math.sin(yaw), z: -Math.cos(yaw) };
    const right = { x: Math.cos(yaw), z: Math.sin(yaw) };

    velocity.x += (fwd.x * dirUp + right.x * dirSide) * ACCEL;
    velocity.z += (fwd.z * dirUp + right.z * dirSide) * ACCEL;

    velocity.x *= FRICTION;
    velocity.z *= FRICTION;

    const speed = Math.hypot(velocity.x, velocity.z);
    if (speed > MAX_SPEED) {
      velocity.x = (velocity.x / speed) * MAX_SPEED;
      velocity.z = (velocity.z / speed) * MAX_SPEED;
    }

    walker.x = Math.min(BOUND, Math.max(-BOUND, walker.x + velocity.x));
    walker.z = Math.min(BOUND, Math.max(-BOUND, walker.z + velocity.z));
  }

  function animate() {
    raf = requestAnimationFrame(animate);
    if (!heroVisible) return;

    if (!prefersReducedMotion) {
      updateWalker();
      currentOffsetX += (targetOffsetX - currentOffsetX) * 0.03;
      currentOffsetY += (targetOffsetY - currentOffsetY) * 0.03;
    }

    const fwd = { x: Math.sin(yaw), z: -Math.cos(yaw) };
    camera.position.set(
      walker.x - fwd.x * CAM_BACK + currentOffsetX,
      EYE_HEIGHT + pitch * 6 + currentOffsetY,
      walker.z - fwd.z * CAM_BACK
    );
    camera.lookAt(walker.x, 0.6 - pitch * 3, walker.z);

    renderer.render(scene, camera);
  }
  animate();

  return {
    destroy: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      heroSection.removeEventListener("pointerdown", onHeroPointerDown as EventListener);
      heroSection.removeEventListener("pointermove", onHeroPointerMove as EventListener);
      heroSection.removeEventListener("pointerup", endHeroDrag);
      heroSection.removeEventListener("pointercancel", endHeroDrag);
      heroSection.removeEventListener("pointerleave", endHeroDrag);
      resizeObserver.disconnect();
      io.disconnect();
      grid.geometry.dispose();
      gridMat.dispose();
      disposables.forEach((d) => {
        d.geometry.dispose();
        d.material.dispose();
      });
      renderer.dispose();
    },
    setDirection,
    onFirstMove: (cb: () => void) => {
      firstMoveCb = cb;
    },
  };
}

