import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  IcosahedronGeometry,
  MeshStandardMaterial,
  Mesh,
  LineBasicMaterial,
  WireframeGeometry,
  LineSegments,
  AmbientLight,
  DirectionalLight,
  Color,
} from "three";

const ACCENT = 0x3454d1;
const INK = 0x14161c;

export function initHeroScene(canvas: HTMLCanvasElement): () => void {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const scene = new Scene();

  const camera = new PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 7.5);

  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const group = new Mesh();

  const coreGeo = new IcosahedronGeometry(1.6, 1);
  const coreMat = new MeshStandardMaterial({
    color: new Color(INK),
    transparent: true,
    opacity: 0.06,
    roughness: 0.4,
    metalness: 0.1,
    flatShading: true,
  });
  const core = new Mesh(coreGeo, coreMat);
  group.add(core);

  const wireGeo = new WireframeGeometry(new IcosahedronGeometry(1.62, 1));
  const wireMat = new LineBasicMaterial({
    color: new Color(ACCENT),
    transparent: true,
    opacity: 0.55,
  });
  const wire = new LineSegments(wireGeo, wireMat);
  group.add(wire);

  const outerWireGeo = new WireframeGeometry(new IcosahedronGeometry(2.05, 0));
  const outerWireMat = new LineBasicMaterial({
    color: new Color(ACCENT),
    transparent: true,
    opacity: 0.15,
  });
  const outerWire = new LineSegments(outerWireGeo, outerWireMat);
  group.add(outerWire);

  scene.add(group);

  const ambient = new AmbientLight(0xffffff, 0.9);
  scene.add(ambient);
  const dir = new DirectionalLight(0xffffff, 0.6);
  dir.position.set(3, 4, 5);
  scene.add(dir);

  let targetRotX = 0;
  let targetRotY = 0;
  let currentRotX = 0;
  let currentRotY = 0;

  function onPointerMove(e: PointerEvent) {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetRotY = nx * 0.35;
    targetRotX = ny * 0.25;
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

  let visible = true;
  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    },
    { threshold: 0 }
  );
  io.observe(canvas);

  let raf = 0;
  let t = 0;

  function animate() {
    raf = requestAnimationFrame(animate);
    if (!visible) return;

    t += 0.0032;

    if (!prefersReducedMotion) {
      group.rotation.y = t * 0.6;
      group.rotation.x = Math.sin(t * 0.5) * 0.15;

      currentRotX += (targetRotX - currentRotX) * 0.04;
      currentRotY += (targetRotY - currentRotY) * 0.04;
      group.rotation.x += currentRotX;
      group.rotation.y += currentRotY;

      outerWire.rotation.z = -t * 0.15;
    }

    renderer.render(scene, camera);
  }
  animate();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onPointerMove);
    resizeObserver.disconnect();
    io.disconnect();
    coreGeo.dispose();
    coreMat.dispose();
    wireGeo.dispose();
    wireMat.dispose();
    outerWireGeo.dispose();
    outerWireMat.dispose();
    renderer.dispose();
  };
}
