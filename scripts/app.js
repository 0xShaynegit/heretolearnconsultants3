/* ==========================================================
   HERE TO LEARN CONSULTANTS
   Vanilla JS. No dependencies.
   ========================================================== */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. STICKY HEADER, BACK TO TOP ---------- */
  var header = document.getElementById("siteHeader");
  var toTop = document.getElementById("toTop");
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    if (toTop) toTop.classList.toggle("is-shown", y > 900);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" }); });

  /* ---------- 2. MOBILE NAV (locks the page while open) ---------- */
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");
  function setNav(open) {
    mainNav.classList.toggle("is-open", open);
    navToggle.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.documentElement.style.overflow = open ? "hidden" : "";
  }
  navToggle.addEventListener("click", function () { setNav(!mainNav.classList.contains("is-open")); });
  mainNav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && mainNav.classList.contains("is-open")) setNav(false); });
  window.matchMedia("(min-width: 1121px)").addEventListener("change", function (e) { if (e.matches) setNav(false); });

  /* ---------- 3. SCROLL REVEAL ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- 4. STAT COUNTERS ---------- */
  function animateCount(el) {
    var target = parseInt(el.dataset.count, 10);
    if (prefersReduced) { el.textContent = target; return; }
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 900, 1);
      el.textContent = Math.max(1, Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var statIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { animateCount(entry.target); statIO.unobserve(entry.target); }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll(".stat-num[data-count]").forEach(function (el) { statIO.observe(el); });

  /* ---------- 5. SERVICES EXPLORER (tabs) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".ex-tab"));
  function showTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      panel.hidden = !on;
      if (on && !prefersReduced) {
        panel.classList.remove("is-entering");
        void panel.offsetWidth;
        panel.classList.add("is-entering");
      }
    });
    if (focus) tab.focus();
  }
  if (tabs.length) {
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { showTab(t); });
      t.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (n) { e.preventDefault(); showTab(tabs[(i + n + tabs.length) % tabs.length], true); }
      });
    });
    // panels are all visible without JS; hide the inactive ones now
    showTab(tabs[0]);
    tabs[0].closest(".explorer").querySelectorAll(".ex-panel").forEach(function (p) { p.classList.remove("is-entering"); });
  }

  /* ---------- 6. IMPACT FILTER ---------- */
  var chips = document.querySelectorAll(".chip[data-filter]");
  var cards = document.querySelectorAll(".impact-card");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.dataset.filter;
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      cards.forEach(function (card) {
        var show = f === "all" || card.dataset.type === f;
        card.hidden = !show;
        card.classList.remove("is-entering");
        if (show && !prefersReduced) { void card.offsetWidth; card.classList.add("is-entering"); }
      });
    });
  });

})();
