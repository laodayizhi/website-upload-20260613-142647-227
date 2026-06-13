(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var menuButton = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-nav-menu]");

    if (menuButton && menu) {
      menuButton.addEventListener("click", function () {
        menu.classList.toggle("is-open");
      });
    }

    var hero = document.querySelector("[data-hero]");

    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
      var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
      var activeIndex = 0;
      var timer = null;

      function showSlide(index) {
        activeIndex = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("is-active", slideIndex === activeIndex);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle("is-active", dotIndex === activeIndex);
        });
      }

      function start() {
        if (slides.length < 2) {
          return;
        }
        timer = window.setInterval(function () {
          showSlide(activeIndex + 1);
        }, 5200);
      }

      function reset() {
        if (timer) {
          window.clearInterval(timer);
        }
        start();
      }

      dots.forEach(function (dot) {
        dot.addEventListener("click", function () {
          showSlide(Number(dot.getAttribute("data-hero-dot")) || 0);
          reset();
        });
      });

      start();
    }

    var searchInput = document.querySelector("[data-search-input]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var activeFilters = {};

    function normalize(value) {
      return String(value || "").toLowerCase().trim();
    }

    function applyFilters() {
      if (!searchInput || !cards.length) {
        return;
      }

      var query = normalize(searchInput.value);

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-type"),
          card.getAttribute("data-year"),
          card.getAttribute("data-tags")
        ].join(" "));
        var matchesQuery = !query || haystack.indexOf(query) !== -1;
        var matchesFilters = Object.keys(activeFilters).every(function (key) {
          return !activeFilters[key] || normalize(card.getAttribute("data-" + key)) === normalize(activeFilters[key]);
        });

        card.classList.toggle("is-hidden-card", !(matchesQuery && matchesFilters));
      });
    }

    if (searchInput && cards.length) {
      var params = new URLSearchParams(window.location.search);
      var preset = params.get("q");

      if (preset) {
        searchInput.value = preset;
      }

      searchInput.addEventListener("input", applyFilters);
      applyFilters();
    }

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var key = button.getAttribute("data-filter");
        var value = button.getAttribute("data-filter-value") || "";
        activeFilters[key] = value;

        filterButtons
          .filter(function (item) {
            return item.getAttribute("data-filter") === key;
          })
          .forEach(function (item) {
            item.classList.toggle("is-active", item === button);
          });

        applyFilters();
      });
    });
  });
})();
