/* ==========================================================
   HERE TO LEARN CONSULTANTS
   Vanilla JS. No dependencies.
   ========================================================== */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. TICKER ---------- */
  var tickerData = [
    "SCHOOL START-UP", "POLICY DEVELOPMENT", "CURRICULUM DEVELOPMENT",
    "LEADERSHIP COACHING", "PEOPLE MANAGEMENT", "SCHOOL IMPROVEMENT",
    "STRATEGIC GROWTH", "ADVICE", "COACHING", "CONSULTANCY", "TRAINING",
    "ONLINE AND IN PERSON", "SCHOOLS ACROSS ASIA"
  ];

  var track = document.getElementById("tickerTrack");
  if (track) {
    var html = "";
    // duplicate the set so the -50% translate loops seamlessly
    for (var d = 0; d < 2; d++) {
      tickerData.forEach(function (t) { html += "<span>" + t + " <i>+</i></span>"; });
    }
    track.innerHTML = html;
  }

  /* ---------- 2. STICKY HEADER + MOBILE NAV ---------- */
  var header = document.getElementById("siteHeader");
  function onHeaderScroll() { header.classList.toggle("is-scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onHeaderScroll, { passive: true });
  onHeaderScroll();

  var navToggle = document.getElementById("navToggle");
  var mainNav = document.querySelector(".main-nav");
  navToggle.addEventListener("click", function () {
    var open = mainNav.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  mainNav.addEventListener("click", function (e) {
    if (e.target.closest("a")) {
      mainNav.classList.remove("is-open");
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- 3. SCROLL REVEAL ---------- */
  var revealEls = document.querySelectorAll(".reveal, .process-step");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(function (el) { io.observe(el); });

  /* ---------- 4. HERO PLAN: pause the walking dots for reduced motion ---------- */
  var plan = document.getElementById("schoolPlan");
  if (plan && prefersReduced && plan.pauseAnimations) plan.pauseAnimations();

  /* ---------- 5. STAT COUNTERS ---------- */
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
      if (entry.isIntersecting) {
        animateCount(entry.target);
        statIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll(".stat-num[data-count]").forEach(function (el) { statIO.observe(el); });

  /* ---------- 6. PROCESS PROGRESS LINE ---------- */
  var processSection = document.getElementById("process");
  var progressBar = document.getElementById("processProgress");
  if (processSection && progressBar) {
    window.addEventListener("scroll", function () {
      var rect = processSection.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (vh - rect.top) / (rect.height + vh * 0.5);
      progress = Math.max(0, Math.min(1, progress));
      progressBar.style.transform = "scaleX(" + progress + ")";
    }, { passive: true });
  }

  /* ---------- 7. STAGE SELECTOR ---------- */
  var stages = [
    {
      title: "Planning a new school",
      text: "You have a vision and perhaps a site. You need structures, policies, a curriculum and the right people in place before the doors open.",
      help: ["School start-up", "Policy and curriculum", "People management"]
    },
    {
      title: "In the first few years",
      text: "The school is open and the early systems are being tested. Leaders are stretched, and habits are forming fast. Now is the time to get them right.",
      help: ["Policy and curriculum", "Leadership coaching", "School improvement"]
    },
    {
      title: "Raising the quality",
      text: "Results, an inspection or your community are telling you it is time for the next step. You want an honest view and a plan your staff believe in.",
      help: ["School improvement", "Leadership coaching", "Staff training"]
    },
    {
      title: "Planning what comes next",
      text: "New phases, a second campus, more students. Growth that keeps the culture that made families choose you in the first place.",
      help: ["Strategic growth", "People management", "Policy and curriculum"]
    }
  ];

  var stageBtns = document.querySelectorAll(".stage-btn");
  var stageOut = document.querySelector(".calc-output");

  function showStage(i) {
    var s = stages[i];
    stageBtns.forEach(function (b, n) {
      b.classList.toggle("is-active", n === i);
      b.setAttribute("aria-pressed", n === i ? "true" : "false");
    });
    stageOut.classList.add("is-swapping");
    setTimeout(function () {
      document.getElementById("stageNum").textContent = "0" + (i + 1);
      document.getElementById("stageTitle").textContent = s.title;
      document.getElementById("stageText").textContent = s.text;
      document.getElementById("stageServices").innerHTML = s.help.map(function (h) { return "<li>" + h + "</li>"; }).join("");
      stageOut.classList.remove("is-swapping");
    }, prefersReduced ? 0 : 220);
  }

  stageBtns.forEach(function (btn) {
    btn.addEventListener("click", function () { showStage(parseInt(btn.dataset.stage, 10)); });
  });

  /* ---------- 8. NETWORK MARQUEE ---------- */
  var rowA = ["CLASSROOM TEACHERS", "SCHOOL LEADERS", "CURRICULUM BUILDERS", "COACHES", "TRAINERS", "SCHOOL FOUNDERS"];
  var rowB = ["SCHOOL START-UP", "POLICY", "CURRICULUM", "LEADERSHIP", "PEOPLE", "IMPROVEMENT", "GROWTH"];

  function fillMarquee(id, names) {
    var row = document.getElementById(id);
    if (!row) return;
    var out = "";
    for (var d = 0; d < 4; d++) {
      names.forEach(function (n) { out += "<span>" + n + "</span>"; });
    }
    row.innerHTML = out;
  }
  fillMarquee("marqueeRow1", rowA);
  fillMarquee("marqueeRow2", rowB);

  /* ---------- 9. CONTACT FORM: opens a prefilled email ---------- */
  var form = document.getElementById("contactForm");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var status = document.getElementById("formStatus");
    if (!form.checkValidity()) {
      status.textContent = "Please add your name and a valid email.";
      status.style.color = "var(--sun)";
      return;
    }
    var f = form.elements;
    var body = [
      "Name: " + f.name.value,
      "Role: " + f.role.value,
      "School: " + f.school.value,
      "Country: " + f.country.value,
      "Email: " + f.email.value,
      "Interested in: " + f.goal.value,
      "",
      f.message.value
    ].join("\n");
    var to = document.getElementById("contactEmail").textContent;
    window.location.href = "mailto:" + to +
      "?subject=" + encodeURIComponent("Enquiry: " + f.goal.value) +
      "&body=" + encodeURIComponent(body);
    status.style.color = "";
    status.textContent = "Your email app should now open with the message ready to send.";
  });

  /* ---------- 10. FAQ: close others on open ---------- */
  var faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open) {
        faqItems.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });

})();
