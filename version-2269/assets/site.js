(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-site-nav]');

  if (menuButton && menu) {
    menuButton.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('is-open');
      document.body.classList.toggle('is-menu-open', isOpen);
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
  }

  var hero = document.querySelector('[data-hero-carousel]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var copies = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-copy]'));
    var current = 0;
    var timer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
      copies.forEach(function (copy, copyIndex) {
        copy.classList.toggle('is-active', copyIndex === current);
      });
    }

    function startTimer() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        showSlide(current + 1);
      }, 5600);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        showSlide(index);
        startTimer();
      });
    });

    showSlide(0);
    startTimer();
  }

  var forms = Array.prototype.slice.call(document.querySelectorAll('[data-search-form]'));
  forms.forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('[data-search-input]');
      var value = input ? input.value.trim() : '';
      var target = form.getAttribute('data-search-target') || 'search.html';
      window.location.href = value ? target + '?q=' + encodeURIComponent(value) : target;
    });
  });

  var filterRoot = document.querySelector('[data-filter-root]');

  if (filterRoot) {
    var cards = Array.prototype.slice.call(filterRoot.querySelectorAll('.movie-card'));
    var searchInput = filterRoot.querySelector('[data-filter-search]');
    var typeSelect = filterRoot.querySelector('[data-filter-type]');
    var regionSelect = filterRoot.querySelector('[data-filter-region]');
    var yearSelect = filterRoot.querySelector('[data-filter-year]');
    var empty = filterRoot.querySelector('[data-filter-empty]');
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';

    if (searchInput && initialQuery) {
      searchInput.value = initialQuery;
    }

    function normalize(value) {
      return String(value || '').toLowerCase();
    }

    function applyFilters() {
      var query = normalize(searchInput ? searchInput.value : '');
      var typeValue = normalize(typeSelect ? typeSelect.value : '');
      var regionValue = normalize(regionSelect ? regionSelect.value : '');
      var yearValue = normalize(yearSelect ? yearSelect.value : '');
      var visible = 0;

      cards.forEach(function (card) {
        var text = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-year'),
          card.getAttribute('data-tags'),
          card.getAttribute('data-genre')
        ].join(' '));
        var matched = true;

        if (query && text.indexOf(query) === -1) {
          matched = false;
        }
        if (typeValue && normalize(card.getAttribute('data-type')).indexOf(typeValue) === -1) {
          matched = false;
        }
        if (regionValue && normalize(card.getAttribute('data-region')).indexOf(regionValue) === -1) {
          matched = false;
        }
        if (yearValue && normalize(card.getAttribute('data-year')) !== yearValue) {
          matched = false;
        }

        card.style.display = matched ? '' : 'none';
        if (matched) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }

    [searchInput, typeSelect, regionSelect, yearSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilters);
        control.addEventListener('change', applyFilters);
      }
    });

    applyFilters();
  }
})();
