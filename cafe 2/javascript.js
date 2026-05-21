/* =============================================
   FORGE COFFEE — script.js
   ============================================= */

"use strict";

/* ────────────────────────────────────────────
   MENU DATA
   ──────────────────────────────────────────── */
const menuData = {
  espresso: [
    {
      name: "Black Forge",
      category: "Espresso",
      desc: "Our house double shot. Single-origin Ethiopian Yirgacheffe pulled at 9 bars. Bright citrus, clean finish.",
      price: "¥500",
      tag: "SIGNATURE"
    },
    {
      name: "Americano",
      category: "Espresso",
      desc: "Two ristretto pulls over filtered water. Preserves the crema and full aromatic profile.",
      price: "¥550",
      tag: "CLASSIC"
    },
    {
      name: "Flat White",
      category: "Espresso",
      desc: "A true Australian flat white. 180ml, double ristretto, micro-foamed whole milk from Hokkaido.",
      price: "¥680",
      tag: "FAVOURITE"
    },
    {
      name: "Cold Espresso Tonic",
      category: "Espresso",
      desc: "Our signature cold build. Strong ristretto over Fever-Tree tonic water and a single ice sphere.",
      price: "¥750",
      tag: "SEASONAL"
    },
    {
      name: "Macchiato",
      category: "Espresso",
      desc: "A single espresso marked with a dollop of dense milk foam. Precise, unapologetic.",
      price: "¥480",
      tag: "PURIST"
    },
    {
      name: "Cortado",
      category: "Espresso",
      desc: "Equal parts espresso and warm milk. No foam, no frills. Spanish precision.",
      price: "¥580",
      tag: "REFINED"
    }
  ],
  brew: [
    {
      name: "V60 Pour Over",
      category: "Brew Bar",
      desc: "45g of fresh ground single origin. 3-minute pour. Full transparency of origin character.",
      price: "¥900",
      tag: "CRAFT"
    },
    {
      name: "Aeropress",
      category: "Brew Bar",
      desc: "Inverted method, 80°C water, 2-minute steep. Intense, syrupy, bold.",
      price: "¥800",
      tag: "INTENSE"
    },
    {
      name: "Cold Brew",
      category: "Brew Bar",
      desc: "18-hour cold steep. Our Colombia Huila, smooth as leather. Ready at 7AM daily.",
      price: "¥850",
      tag: "18HRS"
    },
    {
      name: "Nitro Cold Brew",
      category: "Brew Bar",
      desc: "Cold brew on nitrogen tap. Creamy head, zero sugar, zero milk. Made for real ones.",
      price: "¥950",
      tag: "LIMITED"
    },
    {
      name: "Siphon Brew",
      category: "Brew Bar",
      desc: "Theater and science in one cup. Vacuum extraction. Available weekends only.",
      price: "¥1,200",
      tag: "WEEKEND"
    },
    {
      name: "Chemex 2-Cup",
      category: "Brew Bar",
      desc: "The cleanest cup we serve. Bone-dry finish, complex florals, exceptional clarity.",
      price: "¥1,000",
      tag: "CLEAN"
    }
  ],
  food: [
    {
      name: "Morning Grain Bowl",
      category: "Bites",
      desc: "Farro, toasted pumpkin seeds, soft-boiled egg, miso tahini. Fuel, not fuss.",
      price: "¥1,100",
      tag: "MORNING"
    },
    {
      name: "Dark Rye Toast",
      category: "Bites",
      desc: "Sourdough rye from our partner bakery. Cultured butter, flaked salt. Two slices.",
      price: "¥600",
      tag: "SIMPLE"
    },
    {
      name: "House Granola",
      category: "Bites",
      desc: "Oat clusters, dark cacao nibs, buckwheat honey. Greek yogurt on the side.",
      price: "¥850",
      tag: "DAILY"
    },
    {
      name: "Smoked Salmon Bagel",
      category: "Bites",
      desc: "Sesame bagel, cream cheese, gravlax, capers, dill. Serious sandwich energy.",
      price: "¥1,300",
      tag: "PREMIUM"
    },
    {
      name: "Financier Cake",
      category: "Bites",
      desc: "Brown butter almond cake. Single serve. Perfect with a long espresso.",
      price: "¥480",
      tag: "BAKED"
    },
    {
      name: "70% Dark Chocolate",
      category: "Bites",
      desc: "Single-origin bars from our cacao partner in Ecuador. Two-piece serve.",
      price: "¥350",
      tag: "CRAFT"
    }
  ]
};

/* ────────────────────────────────────────────
   RENDER MENU CARDS
   ──────────────────────────────────────────── */
function renderMenu(tab) {
  const grid = document.getElementById("menuGrid");
  const items = menuData[tab] || [];
  grid.innerHTML = "";

  items.forEach((item, i) => {
    const card = document.createElement("div");
    card.className = "menu-card";
    card.style.animationDelay = `${i * 0.07}s`;
    card.innerHTML = `
      <p class="card-cat">${item.category}</p>
      <h3 class="card-name">${item.name}</h3>
      <p class="card-desc">${item.desc}</p>
      <div class="card-footer">
        <span class="card-price">${item.price}</span>
        <span class="card-tag">${item.tag}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

/* ────────────────────────────────────────────
   MENU TABS
   ──────────────────────────────────────────── */
function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderMenu(tab.dataset.tab);
    });
  });
  renderMenu("espresso"); // default
}

/* ────────────────────────────────────────────
   STICKY HEADER
   ──────────────────────────────────────────── */
function initHeader() {
  const header = document.getElementById("header");
  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 60);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ────────────────────────────────────────────
   HAMBURGER MENU
   ──────────────────────────────────────────── */
function initHamburger() {
  const btn = document.getElementById("hamburger");
  const menu = document.getElementById("mobileMenu");

  btn.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", isOpen);

    const spans = btn.querySelectorAll("span");
    if (isOpen) {
      spans[0].style.transform = "translateY(6.5px) rotate(45deg)";
      spans[1].style.opacity = "0";
      spans[2].style.transform = "translateY(-6.5px) rotate(-45deg)";
    } else {
      spans.forEach(s => (s.style.transform = s.style.opacity = ""));
    }
  });

  // Close on link click
  menu.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      menu.classList.remove("open");
      btn.querySelectorAll("span").forEach(s => (s.style.transform = s.style.opacity = ""));
    });
  });
}

/* ────────────────────────────────────────────
   SCROLL REVEAL
   ──────────────────────────────────────────── */
function initReveal() {
  const targets = document.querySelectorAll(
    "#about .about-grid > *, #menu .menu-header, #access .access-container > *, #footer .footer-top > *"
  );

  targets.forEach(el => el.classList.add("reveal"));

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("visible");
          }, i * 80);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach(el => observer.observe(el));
}

/* ────────────────────────────────────────────
   SMOOTH ACTIVE NAV HIGHLIGHT
   ──────────────────────────────────────────── */
function initActiveNav() {
  const sections = document.querySelectorAll("section[id], footer[id]");
  const links = document.querySelectorAll(".nav-links a");

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(link => {
            link.style.color = "";
            if (link.getAttribute("href") === `#${entry.target.id}`) {
              link.style.color = "var(--gold)";
            }
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach(s => observer.observe(s));
}

/* ────────────────────────────────────────────
   PARALLAX (subtle, performance-safe)
   ──────────────────────────────────────────── */
function initParallax() {
  const imgs = document.querySelectorAll("[data-parallax]");
  if (!imgs.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        imgs.forEach(img => {
          const speed = parseFloat(img.dataset.parallax);
          const rect = img.getBoundingClientRect();
          const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
          img.querySelector("img").style.transform = `translateY(${offset}px) scale(1.1)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ────────────────────────────────────────────
   CURSOR GLOW (desktop only)
   ──────────────────────────────────────────── */
function initCursorGlow() {
  if (window.innerWidth < 768) return;

  const glow = document.createElement("div");
  glow.style.cssText = `
    position: fixed;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%);
    pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 9999;
    transition: opacity 0.3s;
  `;
  document.body.appendChild(glow);

  let mx = 0, my = 0, gx = 0, gy = 0;
  document.addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; });

  (function animate() {
    gx += (mx - gx) * 0.08;
    gy += (my - gy) * 0.08;
    glow.style.left = `${gx}px`;
    glow.style.top = `${gy}px`;
    requestAnimationFrame(animate);
  })();
}

/* ────────────────────────────────────────────
   BADGE SPIN PAUSE ON HOVER
   ──────────────────────────────────────────── */
function initBadge() {
  const badge = document.querySelector(".hero-badge");
  if (!badge) return;
  badge.addEventListener("mouseenter", () => badge.style.animationPlayState = "paused");
  badge.addEventListener("mouseleave", () => badge.style.animationPlayState = "running");
}

/* ────────────────────────────────────────────
   INIT ALL
   ──────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initHamburger();
  initTabs();
  initReveal();
  initActiveNav();
  initParallax();
  initCursorGlow();
  initBadge();

  // Page load console stamp
  console.log(
    "%cFORGE COFFEE & CRAFT%c\nBuilt with obsession · Osaka, JP",
    "color:#c9a84c;font-family:'Courier New';font-size:20px;font-weight:bold;",
    "color:#8a8070;font-family:'Courier New';font-size:11px;"
  );
});