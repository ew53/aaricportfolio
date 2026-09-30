import "./style.css";
import { initHeroScene } from "./three/hero-scene";
import { flagshipProjects, aiHighlights, moreProjects } from "./data/projects";

/* ---------- Hero 3D scene ---------- */
const heroCanvas = document.getElementById("hero-canvas") as HTMLCanvasElement | null;
if (heroCanvas) {
  initHeroScene(heroCanvas);
}

/* ---------- Render project grid ---------- */
const projectGrid = document.getElementById("project-grid");
if (projectGrid) {
  projectGrid.innerHTML = flagshipProjects
    .map(
      (p) => `
      <article class="project-card reveal-up">
        <div class="project-media">
          <img src="${p.image}" alt="${p.name} screenshot" loading="lazy" />
        </div>
        <div class="project-body">
          <span class="project-domain">${p.domain}</span>
          <h3>${p.name}</h3>
          <p>${p.description}</p>
          <div class="chips">
            ${p.tech.map((t) => `<span class="chip">${t}</span>`).join("")}
          </div>
        </div>
      </article>`
    )
    .join("");
}

/* ---------- Render AI highlights ---------- */
const aiGrid = document.getElementById("ai-grid");
if (aiGrid) {
  aiGrid.innerHTML = aiHighlights
    .map(
      (a) => `
      <article class="ai-card reveal-up">
        <span class="project-domain">${a.domain}</span>
        <h3>${a.name}</h3>
        <ul>
          ${a.points.map((pt) => `<li>${pt}</li>`).join("")}
        </ul>
        <div class="chips">
          ${a.tags.map((t) => `<span class="chip chip-accent">${t}</span>`).join("")}
        </div>
      </article>`
    )
    .join("");
}

/* ---------- Render more-work list ---------- */
const workList = document.getElementById("work-list");
if (workList) {
  workList.innerHTML = moreProjects
    .map(
      (p) => `
      <li class="reveal-up">
        <div class="work-row" tabindex="0">
          <div class="work-row-main">
            <h3>${p.name}</h3>
            <span class="work-row-desc">${p.description}</span>
          </div>
          <span class="work-row-meta">
            <span class="domain">${p.domain}</span>
            ${p.meta}
          </span>
        </div>
      </li>`
    )
    .join("");
}

/* ---------- Custom cursor ---------- */
const cursorDot = document.querySelector<HTMLElement>(".cursor-dot");
const cursorRing = document.querySelector<HTMLElement>(".cursor-ring");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (cursorDot && cursorRing && !reduceMotion && hasFinePointer) {
  let ringX = window.innerWidth / 2;
  let ringY = window.innerHeight / 2;
  let targetX = ringX;
  let targetY = ringY;

  window.addEventListener(
    "pointermove",
    (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      cursorDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    },
    { passive: true }
  );

  function loop() {
    ringX += (targetX - ringX) * 0.18;
    ringY += (targetY - ringY) * 0.18;
    cursorRing!.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  }
  loop();

  const interactiveSelector = "a, button, .work-row, .project-card, input, textarea, .avatar-badge";
  document.addEventListener("pointerover", (e) => {
    const target = (e.target as HTMLElement).closest(interactiveSelector);
    cursorRing.classList.toggle("is-active", !!target);
  });
}

/* ---------- Nav scroll-spy ---------- */
const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(".nav-pill a"));
const sectionIds = navLinks.map((a) => a.dataset.nav).filter(Boolean) as string[];
const sections = sectionIds
  .map((id) => document.getElementById(id))
  .filter((el): el is HTMLElement => !!el);

if (sections.length) {
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((a) => a.classList.toggle("is-active", a.dataset.nav === id));
        }
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
  );
  sections.forEach((s) => spy.observe(s));
}

/* ---------- Scroll reveal ---------- */
function setupScrollReveal() {
  const targets = document.querySelectorAll<HTMLElement>(".reveal-up");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );
  targets.forEach((t) => io.observe(t));
}
// Run after dynamic content is injected
setupScrollReveal();

/* ---------- Card tilt ---------- */
if (!reduceMotion && hasFinePointer) {
  document.querySelectorAll<HTMLElement>(".project-card").forEach((card) => {
    card.style.transformStyle = "preserve-3d";
    card.style.perspective = "800px";

    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-2px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

/* ---------- Contact form: reason chips ---------- */
const chipSelect = document.getElementById("chip-select");
const reasonInput = document.getElementById("reason-input") as HTMLInputElement | null;
if (chipSelect && reasonInput) {
  chipSelect.querySelectorAll<HTMLButtonElement>(".chip-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      chipSelect.querySelectorAll(".chip-option").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      reasonInput.value = btn.dataset.value ?? "";
    });
  });
}

/* ---------- Contact form: submit via fetch ---------- */
const contactForm = document.getElementById("contact-form") as HTMLFormElement | null;
const formNote = document.getElementById("form-note");
if (contactForm && formNote) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = contactForm.querySelector<HTMLButtonElement>('button[type="submit"]');
    const endpoint = contactForm.getAttribute("action") ?? "";

    if (!endpoint || endpoint.includes("YOUR_FORM_ID")) {
      formNote.textContent = "Contact form isn't wired up yet — email me directly instead.";
      formNote.hidden = false;
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: new FormData(contactForm),
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        contactForm.reset();
        formNote.textContent = "Thanks — I'll get back to you soon.";
      } else {
        formNote.textContent = "Something went wrong — email me directly instead.";
      }
    } catch {
      formNote.textContent = "Something went wrong — email me directly instead.";
    } finally {
      formNote.hidden = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
