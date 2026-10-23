"use strict";

/*
  Efectos visuales e interacciones. Si se elimina este archivo (y css/efectos.css),
  la página sigue funcionando completa, solo que sin animaciones.
*/

const body = document.body;
const systemReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const MOTION_KEY = "sedeCoban.animaciones";

/* ---------- Preferencia de animaciones (botón + sistema) ---------- */
const readPreference = () => {
  try { return window.localStorage.getItem(MOTION_KEY); } catch { return null; }
};
const savePreference = (value) => {
  try { window.localStorage.setItem(MOTION_KEY, value); } catch { /* sin almacenamiento: solo dura esta visita */ }
};

const stored = readPreference();
let motionOn = stored ? stored === "on" : !systemReduced.matches;
const motionListeners = [];
const onMotionChange = (listener) => motionListeners.push(listener);
const motionToggles = Array.from(document.querySelectorAll(".motion-toggle"));

const applyMotion = () => {
  body.classList.toggle("motion-off", !motionOn);
  for (const toggle of motionToggles) {
    const label = toggle.querySelector(".motion-label");
    if (label) label.textContent = motionOn ? "Pausar animaciones" : "Reanudar animaciones";
  }
  motionListeners.forEach((listener) => listener(motionOn));
};

for (const toggle of motionToggles) {
  toggle.addEventListener("click", () => {
    motionOn = !motionOn;
    savePreference(motionOn ? "on" : "off");
    applyMotion();
  });
}

const debounce = (fn, wait) => {
  let timer = 0;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), wait);
  };
};

/* ---------- Entrada del hero: libera la transformación al terminar ---------- */
for (const element of document.querySelectorAll(".hero-in")) {
  element.addEventListener("animationend", (event) => {
    if (event.target === element && event.animationName.startsWith("hero-in")) {
      element.classList.remove("hero-in");
    }
  });
}

/* ---------- Red de partículas en el hero ---------- */
const canvas = document.querySelector(".hero-canvas");

if (canvas instanceof HTMLCanvasElement && canvas.getContext) {
  const context = canvas.getContext("2d");
  const hero = canvas.parentElement;
  const mouse = { x: -9999, y: -9999 };
  let width = 0;
  let height = 0;
  let points = [];
  let frame = 0;
  let heroVisible = true;

  const draw = () => {
    context.clearRect(0, 0, width, height);
    const linkDistance = 130;

    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      for (let j = i + 1; j < points.length; j += 1) {
        const b = points[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance < linkDistance) {
          context.strokeStyle = `rgba(170, 200, 240, ${(1 - distance / linkDistance) * 0.28})`;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }

      const toMouse = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (toMouse < 180) {
        context.strokeStyle = `rgba(255, 120, 128, ${(1 - toMouse / 180) * 0.6})`;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(mouse.x, mouse.y);
        context.stroke();
      }

      context.fillStyle = a.red ? "rgba(255, 110, 118, .9)" : "rgba(220, 232, 250, .75)";
      context.beginPath();
      context.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      context.fill();
    }
  };

  const step = () => {
    for (const point of points) {
      const dx = mouse.x - point.x;
      const dy = mouse.y - point.y;
      if (Math.abs(dx) < 180 && Math.abs(dy) < 180) {
        point.x += dx * 0.004;
        point.y += dy * 0.004;
      }
      point.x += point.vx;
      point.y += point.vy;
      if (point.x < 0 || point.x > width) point.vx *= -1;
      if (point.y < 0 || point.y > height) point.vy *= -1;
    }
    draw();
    frame = window.requestAnimationFrame(step);
  };

  const start = () => {
    if (!frame && motionOn && heroVisible) frame = window.requestAnimationFrame(step);
  };
  const stop = () => {
    window.cancelAnimationFrame(frame);
    frame = 0;
  };

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.round(Math.min(90, (width * height) / 14000));
    points = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.6 + 0.8,
      red: Math.random() < 0.22
    }));
    draw();
  };

  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    mouse.x = event.clientX - bounds.left;
    mouse.y = event.clientY - bounds.top;
  });
  hero.addEventListener("pointerleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      if (heroVisible) start(); else stop();
    }).observe(hero);
  }

  window.addEventListener("resize", debounce(resize, 200));
  onMotionChange((on) => { if (on) start(); else stop(); });
  resize();
  start();
}

/* ---------- Palabra que se escribe sola en el título ---------- */
const rotator = document.querySelector(".rotator");

if (rotator && rotator.dataset.words) {
  const words = rotator.dataset.words.split("|");
  let wordIndex = 0;
  let charIndex = words[0].length;
  let deleting = true;
  let timer = 0;

  const tick = () => {
    if (deleting) {
      charIndex -= 1;
      if (charIndex <= 0) {
        charIndex = 0;
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
      }
    } else {
      charIndex += 1;
    }

    rotator.textContent = words[wordIndex].slice(0, charIndex) || " ";
    let delay = deleting ? 55 : 95;
    if (!deleting && charIndex === words[wordIndex].length) {
      deleting = true;
      delay = 2400;
    }
    timer = window.setTimeout(tick, delay);
  };

  onMotionChange((on) => {
    window.clearTimeout(timer);
    if (on) {
      timer = window.setTimeout(tick, 2400);
    } else {
      charIndex = words[wordIndex].length;
      deleting = true;
      rotator.textContent = words[wordIndex];
    }
  });
}

/* ---------- Contadores animados ---------- */
const counters = Array.from(document.querySelectorAll("[data-count-from], [data-count-to]"));

for (const counter of counters) {
  const target = counter.dataset.countFrom
    ? document.querySelectorAll(counter.dataset.countFrom).length
    : Number(counter.dataset.countTo);
  counter.dataset.target = String(target);
  counter.textContent = String(target);
}

const runCounter = (counter) => {
  const target = Number(counter.dataset.target);
  if (!motionOn || !Number.isFinite(target)) return;
  const from = target > 100 ? target - 60 : 0;
  const duration = 1400;
  const startTime = performance.now();

  const update = (now) => {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = String(Math.round(from + (target - from) * eased));
    if (progress < 1) window.requestAnimationFrame(update);
  };
  window.requestAnimationFrame(update);
};

if ("IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      runCounter(entry.target);
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.6 });
  counters.forEach((counter) => counterObserver.observe(counter));
}

/* ---------- Encabezados que se revelan al llegar ---------- */
const headings = document.querySelectorAll(".section-heading");
if ("IntersectionObserver" in window) {
  const headingObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.3 });
  headings.forEach((heading) => headingObserver.observe(heading));
} else {
  headings.forEach((heading) => heading.classList.add("is-in"));
}

/* ---------- Tarjetas de carreras que giran ---------- */
for (const card of document.querySelectorAll(".program-card")) {
  const toggle = card.querySelector(".flip-toggle");
  const link = card.querySelector(".card-link");

  if (toggle) {
    toggle.addEventListener("click", () => {
      const flipped = !card.classList.contains("is-flipped");
      card.classList.toggle("is-flipped", flipped);
      toggle.setAttribute("aria-pressed", String(flipped));
    });
  }

  // Al llegar con Tab al enlace del reverso, la tarjeta gira para mostrarlo.
  if (link) {
    link.addEventListener("focus", () => card.classList.add("has-focus"));
    link.addEventListener("blur", () => card.classList.remove("has-focus"));
  }
}

/* ---------- Indicador deslizante de las pestañas ---------- */
const tabList = document.querySelector(".tab-list");
const tabIndicator = tabList ? tabList.querySelector(".tab-indicator") : null;

if (tabList && tabIndicator) {
  const moveIndicator = () => {
    const selected = tabList.querySelector('[aria-selected="true"]');
    if (!selected) return;
    tabIndicator.style.width = `${selected.offsetWidth}px`;
    tabIndicator.style.setProperty("--x", `${selected.offsetLeft}px`);
  };
  new MutationObserver(moveIndicator).observe(tabList, { subtree: true, attributes: true, attributeFilter: ["aria-selected"] });
  window.addEventListener("resize", debounce(moveIndicator, 150));
  moveIndicator();
}

/* ---------- Efectos que siguen al cursor (solo con mouse) ---------- */
if (finePointer) {
  // Luz que sigue al cursor
  for (const element of document.querySelectorAll(".spotlight, .spotlight-dark")) {
    element.addEventListener("pointermove", (event) => {
      const bounds = element.getBoundingClientRect();
      element.style.setProperty("--mx", `${event.clientX - bounds.left}px`);
      element.style.setProperty("--my", `${event.clientY - bounds.top}px`);
    });
    element.addEventListener("pointerleave", () => {
      element.style.removeProperty("--mx");
      element.style.removeProperty("--my");
    });
  }

  // Inclinación 3D con reflejo
  for (const element of document.querySelectorAll("[data-tilt]")) {
    const maxTilt = element.classList.contains("hero-art") ? 7 : 9;
    element.addEventListener("pointermove", (event) => {
      if (!motionOn) return;
      const bounds = element.getBoundingClientRect();
      const px = (event.clientX - bounds.left) / bounds.width;
      const py = (event.clientY - bounds.top) / bounds.height;
      element.style.setProperty("--ry", `${((px - 0.5) * maxTilt).toFixed(2)}deg`);
      element.style.setProperty("--rx", `${((0.5 - py) * maxTilt).toFixed(2)}deg`);
      element.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
      element.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
    });
    element.addEventListener("pointerleave", () => {
      element.style.removeProperty("--rx");
      element.style.removeProperty("--ry");
    });
  }

  // Botones magnéticos
  for (const button of document.querySelectorAll(".magnetic")) {
    button.addEventListener("pointermove", (event) => {
      if (!motionOn) return;
      const bounds = button.getBoundingClientRect();
      const x = (event.clientX - bounds.left - bounds.width / 2) * 0.25;
      const y = (event.clientY - bounds.top - bounds.height / 2) * 0.35;
      button.style.setProperty("--tx", `${x.toFixed(1)}px`);
      button.style.setProperty("--ty", `${y.toFixed(1)}px`);
    });
    button.addEventListener("pointerleave", () => {
      button.style.removeProperty("--tx");
      button.style.removeProperty("--ty");
    });
  }
}

/* ---------- Onda al hacer clic ---------- */
document.addEventListener("pointerdown", (event) => {
  if (!motionOn || !(event.target instanceof Element)) return;
  const target = event.target.closest(".button, .chip, .segmented button, .tab");
  if (!target) return;
  const bounds = target.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.setAttribute("aria-hidden", "true");
  ripple.style.left = `${event.clientX - bounds.left}px`;
  ripple.style.top = `${event.clientY - bounds.top}px`;
  target.append(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
});

/* ---------- Preguntas: apertura suave ---------- */
for (const item of document.querySelectorAll(".faq-item")) {
  const summary = item.querySelector("summary");
  const answer = item.querySelector(".faq-answer");
  if (!summary || !answer || !answer.animate) continue;
  let animating = false;

  summary.addEventListener("click", (event) => {
    if (!motionOn) return;
    event.preventDefault();
    if (animating) return;
    animating = true;

    if (item.open) {
      const animation = answer.animate(
        [{ height: `${answer.offsetHeight}px`, opacity: 1 }, { height: "0px", opacity: 0 }],
        { duration: 260, easing: "ease-in", fill: "forwards" }
      );
      animation.onfinish = () => {
        item.open = false;
        animation.cancel();
        animating = false;
      };
    } else {
      item.open = true;
      const animation = answer.animate(
        [{ height: "0px", opacity: 0 }, { height: `${answer.offsetHeight}px`, opacity: 1 }],
        { duration: 340, easing: "cubic-bezier(.2,.8,.2,1)" }
      );
      animation.onfinish = () => { animating = false; };
    }
  });
}

/* ---------- Línea de tiempo de avisos y botón "volver arriba" ---------- */
const timeline = document.querySelector(".timeline");
const timelineFill = document.querySelector(".timeline-fill");
const toTop = document.querySelector(".to-top");

if (timeline || toTop) {
  let frame = 0;
  const update = () => {
    frame = 0;
    if (timeline && timelineFill) {
      const bounds = timeline.getBoundingClientRect();
      const progress = (window.innerHeight * 0.75 - bounds.top) / Math.max(bounds.height, 1);
      timelineFill.style.setProperty("--progress", Math.min(1, Math.max(0, progress)).toFixed(3));
    }
    if (toTop) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      toTop.classList.toggle("is-shown", window.scrollY > 600);
      toTop.style.setProperty("--p", percent.toFixed(1));
    }
  };
  const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  update();
}

applyMotion();
