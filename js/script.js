/* =========================================================
   LSBAMA — Interactions & animations
   ========================================================= */
(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Thème clair / sombre ---------- */
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");

  themeToggle?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("lsb-theme", next); } catch (e) {}
  });

  /* ---------- 2. Navigation sans href (aucune URL affichée au survol) ---------- */
  const navigate = (link) => {
    const target = (link.dataset.href || "").trim();
    if (!target || target === "#") return;

    // Ancres internes : défilement fluide
    if (target.startsWith("#")) {
      const dest = document.querySelector(target);
      if (dest) {
        dest.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
        try { history.replaceState(null, "", target); } catch (e) {}
      }
      return;
    }

    // Téléchargements (PDF) : lien temporaire programmatique
    if (link.hasAttribute("data-download")) {
      const tmp = document.createElement("a");
      tmp.href = target;
      tmp.download = "";
      document.body.appendChild(tmp);
      tmp.click();
      tmp.remove();
      return;
    }

    // Liens externes : nouvel onglet
    if (/^https?:\/\//.test(target)) {
      window.open(target, "_blank", "noopener");
      return;
    }

    // tel:, mailto:, etc.
    window.location.href = target;
  };

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-href]");
    if (!link) return;
    e.preventDefault();
    navigate(link);
  });

  // Accessibilité clavier (Entrée / Espace) sur les liens sans href
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const link = e.target.closest ? e.target.closest("a[data-href]") : null;
    if (!link) return;
    e.preventDefault();
    navigate(link);
  });

  // Les liens sans href restent focalisables
  document.querySelectorAll("a[data-href]:not([href])").forEach((a) => {
    a.setAttribute("tabindex", "0");
  });

  /* ---------- 3. Scroll : header, progression, retour haut ---------- */
  const header   = document.getElementById("header");
  const progress = document.getElementById("progressBar");
  const toTop    = document.getElementById("toTop");

  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle("scrolled", y > 30);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";

    toTop?.classList.toggle("show", y > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  });

  /* ---------- 4. Défilement molette ralenti (60% de la vitesse) ---------- */
  const SCROLL_FACTOR = 0.6;
  window.addEventListener("wheel", (e) => {
    if (e.ctrlKey || prefersReduced) return; // zoom conservé
    if (e.target.closest("textarea, input, select, [contenteditable='true']")) return;
    e.preventDefault();
    window.scrollBy({
      top:  e.deltaY * SCROLL_FACTOR,
      left: e.deltaX * SCROLL_FACTOR,
      behavior: "instant"
    });
  }, { passive: false });

  /* ---------- 5. Menu mobile ---------- */
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");

  const setMenu = (open) => {
    mobileMenu?.classList.toggle("open", open);
    burger?.classList.toggle("open", open);
    burger?.setAttribute("aria-expanded", String(open));
    mobileMenu?.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);
  };

  burger?.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("open")));
  mobileMenu?.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- 6. Scrollspy (lien actif dans la nav) ---------- */
  const navLinks = [...document.querySelectorAll(".nav-link")];
  const spySections = navLinks
    .map((l) => document.querySelector(l.dataset.href))
    .filter(Boolean);

  if ("IntersectionObserver" in window && spySections.length) {
    const spyIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((l) =>
          l.classList.toggle("active", l.dataset.href === "#" + entry.target.id)
        );
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    spySections.forEach((s) => spyIO.observe(s));
  }

  /* ---------- 7. Révélations au scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");

  if (prefersReduced || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("visible"));
  } else {
    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => revealIO.observe(el));
  }

  /* ---------- 8. Compteurs animés ---------- */
  const counters = document.querySelectorAll("[data-count]");

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    if (prefersReduced) { el.textContent = target; return; }

    const duration = 1600;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * ease(p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if ("IntersectionObserver" in window) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((c) => counterIO.observe(c));
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------- 9. Effet "décodage" sur le titre du hero ---------- */
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%*+";

  const scramble = (el, delay) => {
    const text = el.dataset.text || el.textContent;
    if (prefersReduced) { el.textContent = text; return; }

    let frame = 0;
    const total = Math.max(24, Math.floor(text.length * 1.6));

    setTimeout(function run() {
      frame++;
      const locked = Math.floor((frame / total) * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === " ") { out += " "; continue; }
        out += i < locked ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (frame < total) setTimeout(run, 28);
      else el.textContent = text;
    }, delay);
  };

  document.querySelectorAll(".scramble").forEach((el, i) => scramble(el, 350 + i * 500));

  /* ---------- 10. Accordéon FAQ ---------- */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-q");
    const a = item.querySelector(".faq-a");

    q?.addEventListener("click", () => {
      const wasOpen = item.classList.contains("open");

      document.querySelectorAll(".faq-item.open").forEach((o) => {
        o.classList.remove("open");
        o.querySelector(".faq-a").style.maxHeight = null;
        o.querySelector(".faq-q").setAttribute("aria-expanded", "false");
      });

      if (!wasOpen) {
        item.classList.add("open");
        a.style.maxHeight = a.scrollHeight + "px";
        q.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---------- 11. Formulaire de contact + toasts SVG ---------- */
  const form = document.getElementById("contactForm");
  let toastTimer;

  const TOAST_ICONS = {
    success: '<svg class="ico" aria-hidden="true"><use href="#i-check"/></svg>',
    error:   '<svg class="ico" aria-hidden="true"><use href="#i-alert"/></svg>'
  };

  const toast = (msg, type = "success") => {
    const t = document.getElementById("toast");
    if (!t) return;
    t.querySelector(".toast-ico").innerHTML = TOAST_ICONS[type] || TOAST_ICONS.success;
    t.querySelector(".toast-msg").textContent = msg;
    t.classList.toggle("error", type === "error");
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3800);
  };

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const fields = {
      nom: form.nom,
      email: form.email,
      message: form.message,
    };
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value.trim());

    let valid = true;
    Object.entries(fields).forEach(([key, input]) => {
      const ok = key === "email" ? emailOk : input.value.trim().length >= 2;
      input.closest(".field").classList.toggle("error", !ok);
      if (!ok) valid = false;
    });

    if (!valid) {
      toast("Veuillez remplir correctement les champs requis.", "error");
      return;
    }

    // Ici, on branchera un vrai envoi (PHP, service d'emails...) plus tard.
    toast("Message envoyé ! Nous vous répondrons rapidement.", "success");
    form.reset();
  });

  form?.addEventListener("input", (e) => {
    e.target.closest(".field")?.classList.remove("error");
  });

  /* ---------- 12. Année dynamique dans le footer ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();