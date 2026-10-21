/* ==========================================================
   MERIDIAN LENDING CO. / INDUSTRIAL
   Vanilla JS. No dependencies.
   ========================================================== */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. LIVE RATE TICKER ---------- */
  var tickerData = [
    { label: "RBA CASH RATE", value: "3.85%", dir: 0 },
    { label: "AVG VARIABLE (OO P&I)", value: "6.12%", dir: 1 },
    { label: "BEST PANEL VARIABLE", value: "5.89%", dir: -1 },
    { label: "BEST 2YR FIXED", value: "5.64%", dir: -1 },
    { label: "BEST 3YR FIXED", value: "5.59%", dir: -1 },
    { label: "AVG INVESTOR (IO)", value: "6.41%", dir: 1 },
    { label: "AUD/USD", value: "0.6712", dir: 1 },
    { label: "LOANS SETTLED THIS MONTH", value: "31", dir: 0 }
  ];

  var track = document.getElementById("tickerTrack");
  if (track) {
    var html = "";
    // duplicate the set so the -50% translate loops seamlessly
    for (var d = 0; d < 2; d++) {
      tickerData.forEach(function (t) {
        var arrow = t.dir > 0 ? '<i class="tick-up">&#9650;</i>' : t.dir < 0 ? '<i class="tick-dn">&#9660;</i>' : "";
        html += "<span>" + t.label + " <b>" + t.value + "</b> " + arrow + "</span>";
      });
    }
    track.innerHTML = html;
  }

  /* ---------- 2. STICKY HEADER + MOBILE NAV ---------- */
  var header = document.getElementById("siteHeader");
  window.addEventListener("scroll", function () {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  }, { passive: true });

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

  /* ---------- 4. ANIMATED STAT COUNTERS ---------- */
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    var prefix = el.dataset.prefix || "";
    var suffix = el.dataset.suffix || "";
    var duration = 1600;
    var start = null;

    if (prefersReduced) {
      el.textContent = prefix + target.toFixed(decimals) + suffix;
      return;
    }

    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = prefix + (decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString("en-AU")) + suffix;
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
  document.querySelectorAll(".stat-num").forEach(function (el) { statIO.observe(el); });

  /* ---------- 5. PROCESS PROGRESS LINE ---------- */
  var processSection = document.getElementById("process");
  var progressBar = document.getElementById("processProgress");
  if (processSection && progressBar) {
    window.addEventListener("scroll", function () {
      var rect = processSection.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (vh - rect.top) / (rect.height + vh * 0.5);
      progress = Math.max(0, Math.min(1, progress));
      progressBar.style.width = (progress * 100) + "%";
    }, { passive: true });
  }

  /* ---------- 6. REPAYMENT CALCULATOR + GAUGE ---------- */
  var amountEl = document.getElementById("loanAmount");
  var rateEl = document.getElementById("interestRate");
  var termEl = document.getElementById("loanTerm");
  var freqBtns = document.querySelectorAll(".freq-btn");
  var freq = 12;

  var GAUGE_MAX_MONTHLY = 12000; // needle full-scale deflection
  var gaugeFill = document.getElementById("gaugeFill");
  var gaugeNeedle = document.getElementById("gaugeNeedle");
  var gaugeTicks = document.getElementById("gaugeTicks");

  // build gauge tick marks
  if (gaugeTicks) {
    var svgNS = "http://www.w3.org/2000/svg";
    for (var i = 0; i <= 10; i++) {
      var ang = (-90 + i * 18) * Math.PI / 180;
      var cx = 110, cy = 115;
      var r1 = 78, r2 = i % 5 === 0 ? 68 : 73;
      var line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", cx + r1 * Math.sin(ang));
      line.setAttribute("y1", cy - r1 * Math.cos(ang));
      line.setAttribute("x2", cx + r2 * Math.sin(ang));
      line.setAttribute("y2", cy - r2 * Math.cos(ang));
      gaugeTicks.appendChild(line);
    }
  }

  function money(n) {
    return "$" + Math.round(n).toLocaleString("en-AU");
  }

  var displayedRepay = 0;
  var repayAnimFrame = null;

  function tweenRepayValue(target) {
    var el = document.getElementById("repayValue");
    if (prefersReduced) { el.textContent = money(target); displayedRepay = target; return; }
    cancelAnimationFrame(repayAnimFrame);
    var from = displayedRepay;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 400, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      displayedRepay = from + (target - from) * eased;
      el.textContent = money(displayedRepay);
      if (p < 1) repayAnimFrame = requestAnimationFrame(step);
    }
    repayAnimFrame = requestAnimationFrame(step);
  }

  function calc() {
    var P = parseFloat(amountEl.value);
    var annual = parseFloat(rateEl.value);
    var years = parseInt(termEl.value, 10);

    document.getElementById("loanAmountOut").textContent = money(P);
    document.getElementById("interestRateOut").textContent = annual.toFixed(2) + "%";
    document.getElementById("loanTermOut").textContent = years + " YRS";

    var monthlyRate = annual / 100 / 12;
    var n = years * 12;
    var monthly = P * monthlyRate / (1 - Math.pow(1 + monthlyRate, -n));
    var perPeriod = monthly * 12 / freq;

    var freqLabel = freq === 52 ? "WEEKLY" : freq === 26 ? "FORTNIGHTLY" : "MONTHLY";
    document.getElementById("repayLabel").textContent = freqLabel + " REPAYMENT";
    tweenRepayValue(perPeriod);

    var totalRepaid = monthly * n;
    document.getElementById("totalInterest").textContent = money(totalRepaid - P);
    document.getElementById("totalRepaid").textContent = money(totalRepaid);

    // gauge: fraction of full-scale monthly repayment
    var frac = Math.max(0, Math.min(1, monthly / GAUGE_MAX_MONTHLY));
    var arcLen = 283; // approx length of the 180deg arc, r=95 -> pi*95
    gaugeFill.style.strokeDashoffset = arcLen * (1 - frac);
    gaugeNeedle.style.transform = "rotate(" + (-90 + frac * 180) + "deg)";
  }

  [amountEl, rateEl, termEl].forEach(function (el) {
    el.addEventListener("input", calc);
  });

  freqBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      freqBtns.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      freq = parseInt(btn.dataset.freq, 10);
      calc();
    });
  });

  calc();

  /* ---------- 7. LENDER MARQUEE ---------- */
  var lendersA = ["COMMONWEALTH BANK", "WESTPAC", "NAB", "ANZ", "MACQUARIE", "ING", "SUNCORP", "BANKWEST", "ST.GEORGE", "AMP BANK"];
  var lendersB = ["BENDIGO BANK", "BOQ", "ME BANK", "UBANK", "GREAT SOUTHERN", "FIRSTMAC", "PEPPER MONEY", "LIBERTY", "RESIMAC", "LA TROBE"];

  function fillMarquee(id, names) {
    var row = document.getElementById(id);
    if (!row) return;
    var out = "";
    for (var d = 0; d < 2; d++) {
      names.forEach(function (n) { out += "<span>" + n + "</span>"; });
    }
    row.innerHTML = out;
  }
  fillMarquee("marqueeRow1", lendersA);
  fillMarquee("marqueeRow2", lendersB);

  /* ---------- 8. TESTIMONIAL ROTATOR ---------- */
  var quotes = [
    {
      text: "Meridian restructured our two loans into one split facility and cut our rate by 0.74%. The written recommendation read like an engineering report. We knew exactly why every decision was made.",
      author: "R. & K. THOMPSON / REFINANCE / BRISBANE QLD"
    },
    {
      text: "First home, 5% deposit, First Home Guarantee spot secured before the round closed. Pre-approval in six business days. Every step was documented before it happened.",
      author: "S. NGUYEN / FIRST HOME BUYER / WESTERN SYDNEY NSW"
    },
    {
      text: "Three investment properties, one broker, zero drama. They model serviceability two purchases ahead, which is why the third approval went through without a restructure.",
      author: "D. PATTERSON / INVESTOR / GEELONG VIC"
    }
  ];

  var qIndex = 0;
  var qText = document.getElementById("quoteText");
  var qAuthor = document.getElementById("quoteAuthor");
  var qCounter = document.getElementById("quoteCounter");
  var qTimer = null;

  function showQuote(i) {
    qIndex = (i + quotes.length) % quotes.length;
    qText.style.opacity = "0";
    qAuthor.style.opacity = "0";
    setTimeout(function () {
      qText.textContent = quotes[qIndex].text;
      qAuthor.textContent = quotes[qIndex].author;
      qCounter.textContent = "0" + (qIndex + 1) + " / 0" + quotes.length;
      qText.style.opacity = "1";
      qAuthor.style.opacity = "1";
    }, prefersReduced ? 0 : 300);
  }

  function resetQuoteTimer() {
    clearInterval(qTimer);
    if (!prefersReduced) qTimer = setInterval(function () { showQuote(qIndex + 1); }, 8000);
  }

  document.getElementById("quotePrev").addEventListener("click", function () { showQuote(qIndex - 1); resetQuoteTimer(); });
  document.getElementById("quoteNext").addEventListener("click", function () { showQuote(qIndex + 1); resetQuoteTimer(); });
  resetQuoteTimer();

  /* ---------- 9. CONTACT FORM (demo handler) ---------- */
  var form = document.getElementById("contactForm");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var status = document.getElementById("formStatus");
    if (!form.checkValidity()) {
      status.textContent = "INPUT ERROR. CHECK REQUIRED FIELDS.";
      status.style.color = "var(--accent-copper)";
      return;
    }
    status.style.color = "";
    status.textContent = "REQUEST LOGGED. WE CALL WITHIN ONE BUSINESS DAY.";
    form.reset();
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
