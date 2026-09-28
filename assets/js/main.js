(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  // AOS
  if (window.AOS) {
    AOS.init({ duration: 700, once: true, offset: 60 });
  }

  // Sticky header shadow
  var header = document.getElementById("header");
  var scrollTop = document.getElementById("scrollTop");

  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 20);
    if (scrollTop) scrollTop.classList.toggle("visible", y > 600);
  });

  if (scrollTop) {
    scrollTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Reviews slider
  if (window.Swiper && document.querySelector(".reviews-slider")) {
    new Swiper(".reviews-slider", {
      slidesPerView: 1,
      spaceBetween: 30,
      loop: true,
      speed: 600,
      autoplay: { delay: 5000, pauseOnMouseEnter: true },
      pagination: { el: ".swiper-pagination", clickable: true },
      breakpoints: {
        820: { slidesPerView: 2 },
        1300: { slidesPerView: 3 }
      }
    });
  }

  // Before / after slider
  document.querySelectorAll(".compare").forEach(function (box) {
    var range = box.querySelector(".compare-range");
    var before = box.querySelector(".compare-before");
    var update = function () {
      before.style.clipPath = "inset(0 " + (100 - range.value) + "% 0 0)";
      box.style.setProperty("--pos", range.value + "%");
    };
    range.addEventListener("input", update);
    update();
  });

  // Open now / closed
  var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var toTime = function (t) {
    var p = t.split(":");
    return +p[0] * 60 + +p[1];
  };
  var label = function (min) {
    var h = Math.floor(min / 60), m = min % 60;
    var suffix = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return h + (m ? ":" + (m < 10 ? "0" : "") + m : "") + " " + suffix;
  };

  document.querySelectorAll(".open-status[data-hours]").forEach(function (el) {
    var hours = {};
    el.getAttribute("data-hours").split(";").forEach(function (rule) {
      var parts = rule.trim().split(" ");
      var range = parts[0].split("-");
      var time = parts[1].split("-");
      for (var d = +range[0]; d <= +(range[1] || range[0]); d++) {
        hours[d] = [toTime(time[0]), toTime(time[1])];
      }
    });

    var now = new Date();
    var today = hours[now.getDay()];
    var min = now.getHours() * 60 + now.getMinutes();

    if (today && min >= today[0] && min < today[1]) {
      el.textContent = "Open now until " + label(today[1]);
      el.classList.add("is-open");
    } else {
      for (var i = 0; i < 7; i++) {
        var day = (now.getDay() + i) % 7;
        if (hours[day] && (i > 0 || min < hours[day][0])) {
          el.textContent = "Closed, opens " + (i === 0 ? "today" : i === 1 ? "tomorrow" : days[day]) + " " + label(hours[day][0]);
          break;
        }
      }
      el.classList.add("is-closed");
    }
  });

  // Counter
  var counters = document.querySelectorAll("[data-counter]");
  if (counters.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = +el.getAttribute("data-counter");
        var suffix = el.getAttribute("data-suffix") || "";
        var start = null;
        var step = function (ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 1400, 1);
          el.textContent = Math.floor(target * p).toLocaleString("en-US") + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { io.observe(c); });
  }

  // Gallery filter
  var filterButtons = document.querySelectorAll(".gallery-filter button");
  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var filter = btn.getAttribute("data-filter");
      filterButtons.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      document.querySelectorAll(".gallery-item").forEach(function (item) {
        item.classList.toggle("d-none", filter !== "all" && item.getAttribute("data-category") !== filter);
      });
    });
  });

  // Appointment time slots
  var dateInput = document.getElementById("date");
  var slotBox = document.getElementById("timeSlots");
  var timeInput = document.getElementById("time");

  if (dateInput && slotBox) {
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.getFullYear() + "-" + pad(tomorrow.getMonth() + 1) + "-" + pad(tomorrow.getDate());

    var renderSlots = function () {
      slotBox.innerHTML = "";
      timeInput.value = "";
      if (!dateInput.value) {
        slotBox.innerHTML = '<p class="slot-note">Choose a date to see free times.</p>';
        return;
      }
      var date = new Date(dateInput.value + "T00:00:00");
      var day = date.getDay();
      var end = day === 5 ? 15 : day === 6 ? 14 : 18;
      var start = day === 6 ? 9 : 8;
      if (day === 0) {
        slotBox.innerHTML = '<p class="slot-note">We are closed on Sundays. For an emergency call (303) 123-4599.</p>';
        return;
      }
      for (var h = start; h < end; h++) {
        [0, 30].forEach(function (m) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "time-slot";
          btn.textContent = label(h * 60 + m);
          // fake busy slots for the demo
          if ((date.getDate() * 7 + h * 3 + m) % 5 === 0) btn.disabled = true;
          btn.addEventListener("click", function () {
            slotBox.querySelectorAll(".time-slot").forEach(function (s) { s.classList.remove("active"); });
            btn.classList.add("active");
            timeInput.value = btn.textContent;
          });
          slotBox.appendChild(btn);
        });
      }
    };
    dateInput.addEventListener("change", renderSlots);
    renderSlots();
  }

  // Demo forms
  document.querySelectorAll(".demo-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }
      if (timeInput && form.contains(timeInput) && !timeInput.value) {
        slotBox.classList.add("slot-error");
        return;
      }
      var msg = form.querySelector(".form-message");
      if (msg) msg.classList.remove("d-none");
      form.reset();
      form.classList.remove("was-validated");
      // renderSlots();
    });
  });
})();
