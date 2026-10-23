"use strict";

/*
  Comportamiento de la página. No hace falta editar este archivo para cambiar contenido:
  todo el texto, las carreras, los avisos y los datos de contacto están en index.html.
*/

document.body.classList.add("js-enabled");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const normalizeText = (value) => value
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .toLocaleLowerCase("es");

// Región accesible para anunciar acciones (por ejemplo, "Copiado").
const liveRegion = document.createElement("p");
liveRegion.className = "sr-only";
liveRegion.setAttribute("aria-live", "polite");
document.body.append(liveRegion);
const announce = (message) => {
  liveRegion.textContent = "";
  window.setTimeout(() => { liveRegion.textContent = message; }, 50);
};

/* ---------- Año del pie de página ---------- */
const currentYear = document.querySelector("#current-year");
if (currentYear) currentYear.textContent = String(new Date().getFullYear());

/* ---------- Menú móvil ---------- */
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

if (menuToggle && siteNav) {
  const setMenu = (open) => {
    menuToggle.setAttribute("aria-expanded", String(open));
    siteNav.classList.toggle("is-open", open);
  };

  menuToggle.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) setMenu(false);
  });

  document.addEventListener("click", (event) => {
    if (!siteNav.classList.contains("is-open")) return;
    if (event.target instanceof Node && !siteNav.contains(event.target) && !menuToggle.contains(event.target)) setMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteNav.classList.contains("is-open")) {
      setMenu(false);
      menuToggle.focus();
    }
  });
}

/* ---------- Encabezado: sombra al desplazarse y barra de progreso ---------- */
const siteHeader = document.querySelector(".site-header");
const readingProgress = document.querySelector(".reading-progress");

if (siteHeader) {
  let frame = 0;
  const onScroll = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      siteHeader.classList.toggle("is-scrolled", window.scrollY > 8);
      if (readingProgress) readingProgress.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
      frame = 0;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
}

/* ---------- Menú activo según la sección visible ---------- */
if (siteNav && "IntersectionObserver" in window) {
  const navLinks = Array.from(siteNav.querySelectorAll('a[href^="#"]'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const spy = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of navLinks) {
        const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("is-active", isCurrent);
        if (isCurrent) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    }
  }, { rootMargin: "-45% 0px -50% 0px" });

  sections.forEach((section) => spy.observe(section));
}

/* ---------- Pestañas (La sede / La universidad) ---------- */
const activateTab = (tab, setFocus = false) => {
  const tablist = tab.closest('[role="tablist"]');
  if (!tablist) return;
  for (const other of tablist.querySelectorAll('[role="tab"]')) {
    const selected = other === tab;
    other.setAttribute("aria-selected", String(selected));
    other.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(other.getAttribute("aria-controls"));
    if (panel) panel.hidden = !selected;
  }
  if (setFocus) tab.focus();
};

for (const tablist of document.querySelectorAll('[role="tablist"]')) {
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const selectedTab = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0];
  activateTab(selectedTab);

  tablist.addEventListener("click", (event) => {
    const tab = event.target instanceof Element ? event.target.closest('[role="tab"]') : null;
    if (tab) activateTab(tab);
  });

  tablist.addEventListener("keydown", (event) => {
    const index = tabs.indexOf(document.activeElement);
    if (index === -1) return;
    let next = null;
    if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
    if (event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
    if (event.key === "Home") next = tabs[0];
    if (event.key === "End") next = tabs[tabs.length - 1];
    if (next) {
      event.preventDefault();
      activateTab(next, true);
    }
  });
}

/* ---------- Carreras: filtro por área + búsqueda ---------- */
const programSearch = document.querySelector("#program-search");
const programCards = Array.from(document.querySelectorAll(".program-card"));
const programCount = document.querySelector("#program-count");
const noPrograms = document.querySelector("#no-programs");
const areaChips = Array.from(document.querySelectorAll(".chip[data-area]"));
const clearFilters = document.querySelector("#clear-filters");
const modeChips = Array.from(document.querySelectorAll(".chip[data-modalidad]"));
let activeArea = "todas";
let activeMode = "todas";

const filterPrograms = () => {
  const term = normalizeText(programSearch ? programSearch.value.trim() : "");
  let visible = 0;

  for (const card of programCards) {
    const text = normalizeText(`${card.dataset.search || ""} ${card.textContent}`);
    const matchesArea = activeArea === "todas" || card.dataset.area === activeArea;
    const matchesMode = activeMode === "todas" || (card.dataset.modalidad || "").split(" ").includes(activeMode);
    const matches = matchesArea && matchesMode && text.includes(term);
    card.hidden = !matches;
    if (matches) visible += 1;
  }

  if (programCount) programCount.textContent = `${visible} ${visible === 1 ? "programa" : "programas"}`;
  if (noPrograms) noPrograms.hidden = visible !== 0;
};

const pressOnly = (chips, selected) => chips.forEach((chip) => chip.setAttribute("aria-pressed", String(chip === selected)));

for (const chip of areaChips) {
  chip.addEventListener("click", () => {
    activeArea = chip.dataset.area;
    pressOnly(areaChips, chip);
    filterPrograms();
  });
}

for (const chip of modeChips) {
  chip.addEventListener("click", () => {
    activeMode = chip.dataset.modalidad;
    pressOnly(modeChips, chip);
    filterPrograms();
  });
}

if (programSearch) programSearch.addEventListener("input", filterPrograms);

if (clearFilters) {
  clearFilters.addEventListener("click", () => {
    activeArea = "todas";
    activeMode = "todas";
    pressOnly(areaChips, areaChips.find((chip) => chip.dataset.area === "todas"));
    pressOnly(modeChips, modeChips.find((chip) => chip.dataset.modalidad === "todas"));
    if (programSearch) programSearch.value = "";
    filterPrograms();
    if (programSearch) programSearch.focus();
  });
}

if (programCards.length) filterPrograms();

/* ---------- Avisos: orden por fecha y estado automático ---------- */
const noticeList = document.querySelector("#notice-list");
const noNotices = document.querySelector("#no-notices");
const noticeFilters = Array.from(document.querySelectorAll("[data-notice-filter]"));

if (noticeList) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 86400000;

  const parseDate = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const notices = Array.from(noticeList.querySelectorAll(".notice")).map((element) => {
    const date = parseDate(element.dataset.fecha);
    const diff = date ? Math.round((date - today) / dayMs) : null;
    return { element, date, diff };
  });

  for (const { element, date, diff } of notices) {
    const day = element.querySelector(".notice-day");
    const month = element.querySelector(".notice-month");
    const when = element.querySelector(".notice-when");

    if (!date) {
      element.classList.add("is-undated");
      if (when) when.textContent = "Fecha por confirmar";
      continue;
    }

    if (day) day.textContent = String(date.getDate());
    if (month) month.textContent = date.toLocaleDateString("es-GT", { month: "short" }).replace(".", "");

    let label = "Finalizado";
    if (diff === 0) label = "Hoy";
    else if (diff === 1) label = "Mañana";
    else if (diff > 1) label = `En ${diff} días`;
    element.classList.toggle("is-past", diff < 0);

    if (when) {
      when.textContent = label;
      const fullDate = document.createElement("span");
      fullDate.className = "sr-only";
      fullDate.textContent = `, ${date.toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" })}`;
      when.append(fullDate);
    }
  }

  // Próximos primero (del más cercano al más lejano), luego sin fecha y al final los finalizados.
  const rank = ({ diff }) => (diff === null ? 1 : diff < 0 ? 2 : 0);
  notices
    .sort((a, b) => rank(a) - rank(b) || (rank(a) === 2 ? b.diff - a.diff : (a.diff || 0) - (b.diff || 0)))
    .forEach(({ element }) => noticeList.append(element));

  const applyNoticeFilter = (mode) => {
    let visible = 0;
    for (const { element, diff } of notices) {
      const show = mode === "todos" || diff === null || diff >= 0;
      element.hidden = !show;
      if (show) visible += 1;
    }
    if (noNotices) noNotices.hidden = visible !== 0;
  };

  for (const button of noticeFilters) {
    button.addEventListener("click", () => {
      noticeFilters.forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
      applyNoticeFilter(button.dataset.noticeFilter);
    });
  }

  applyNoticeFilter("proximos");
}

/* ---------- Preguntas frecuentes: búsqueda ---------- */
const faqSearch = document.querySelector("#faq-search");
const faqItems = Array.from(document.querySelectorAll(".faq-item"));
const faqCount = document.querySelector("#faq-count");

if (faqSearch && faqItems.length) {
  faqSearch.addEventListener("input", () => {
    const term = normalizeText(faqSearch.value.trim());
    let visible = 0;
    for (const item of faqItems) {
      const matches = normalizeText(item.textContent).includes(term);
      item.hidden = !matches;
      if (matches) visible += 1;
      if (term && matches) item.open = true;
    }
    if (faqCount) {
      faqCount.textContent = term
        ? (visible ? `${visible} ${visible === 1 ? "pregunta encontrada" : "preguntas encontradas"}` : "Sin coincidencias. Revisa la sección de contacto.")
        : "";
    }
  });
}

/* ---------- Contacto: enlaces y botón copiar cuando el dato ya está completo ---------- */
const copyText = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Alternativa para sitios servidos por HTTP (por ejemplo, mediante IP sin certificado).
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.append(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
};

for (const field of document.querySelectorAll("[data-contacto]")) {
  if (field.querySelector("[data-pendiente]")) continue;
  const value = field.textContent.trim();
  if (!value) continue;
  const type = field.dataset.contacto;

  if (type === "telefono" || type === "correo") {
    const link = document.createElement("a");
    link.href = type === "telefono" ? `tel:${value.replace(/[^\d+]/g, "")}` : `mailto:${value}`;
    link.textContent = value;
    field.textContent = "";
    field.append(link);
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-button";
  button.textContent = "Copiar";
  button.addEventListener("click", async () => {
    try {
      await copyText(value);
      button.textContent = "Copiado ✓";
      announce(`${value} copiado`);
    } catch {
      button.textContent = "No se pudo copiar";
    }
    window.setTimeout(() => { button.textContent = "Copiar"; }, 2000);
  });
  field.append(button);
}

/* ---------- Modo revisión: abre la página con ?revisar ---------- */
const pendingFields = Array.from(document.querySelectorAll("[data-pendiente]"));
const reviewPanel = document.querySelector("#review-panel");

if (pendingFields.length) {
  console.info(`Datos por completar: ${pendingFields.length}. Abre la página con ?revisar para ver la lista.`);
}

if (reviewPanel && new URLSearchParams(window.location.search).has("revisar")) {
  const list = reviewPanel.querySelector("#review-list");
  const count = reviewPanel.querySelector("#review-count");
  document.body.classList.add("review-mode");

  pendingFields.forEach((field, index) => {
    if (!field.id) field.id = `pendiente-${index + 1}`;
    const section = field.closest("section");
    const heading = section ? section.querySelector("h2") : null;
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${field.id}`;
    link.textContent = `${heading ? heading.textContent.trim() : "Página"}: ${field.textContent.trim()}`;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const panel = field.closest('[role="tabpanel"]');
      if (panel && panel.hidden) {
        const tab = document.querySelector(`[aria-controls="${panel.id}"]`);
        if (tab) activateTab(tab);
      }
      const details = field.closest("details");
      if (details) details.open = true;
      field.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      field.classList.remove("is-flash");
      void field.offsetWidth;
      field.classList.add("is-flash");
    });
    item.append(link);
    list.append(item);
  });

  count.textContent = pendingFields.length
    ? `${pendingFields.length} campos marcados con [ ] esperan información confirmada.`
    : "No quedan datos pendientes.";
  reviewPanel.hidden = false;
  reviewPanel.querySelector(".review-close").addEventListener("click", () => { reviewPanel.hidden = true; });
}

/* ---------- Animación de entrada al desplazarse ---------- */
if (!reducedMotion && "IntersectionObserver" in window) {
  const targets = document.querySelectorAll(".program-card, .service-card, .identity-card, .notice, .faq-item, .contact-list, .map-card, .stat, .photo-panels");
  const revealer = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.1 });

  targets.forEach((target, index) => {
    target.classList.add("js-reveal");
    target.style.setProperty("--reveal-delay", `${(index % 3) * 70}ms`);
    revealer.observe(target);
  });
}
