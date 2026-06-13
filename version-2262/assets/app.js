(function () {
  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function bindMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    if (!button) {
      return;
    }
    button.addEventListener('click', function () {
      document.body.classList.toggle('menu-open');
    });
  }

  function bindHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = selectAll('[data-hero-slide]', hero);
    var dots = selectAll('[data-hero-dot]', hero);
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function show(index) {
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
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function yearMatches(value, year) {
    if (!value) {
      return true;
    }
    var numericYear = Number(year || 0);
    if (value === '2020') {
      return numericYear >= 2020;
    }
    if (value === '2010') {
      return numericYear >= 2010 && numericYear < 2020;
    }
    if (value === '2000') {
      return numericYear >= 2000 && numericYear < 2010;
    }
    if (value === '1990') {
      return numericYear > 0 && numericYear < 2000;
    }
    return true;
  }

  function bindFilters() {
    var cards = selectAll('[data-card]');
    if (!cards.length) {
      return;
    }
    var queryInput = document.querySelector('[data-filter="query"]');
    var typeSelect = document.querySelector('[data-filter="type"]');
    var yearSelect = document.querySelector('[data-filter="year"]');
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q');

    if (queryInput && initialQuery) {
      queryInput.value = initialQuery;
    }

    function apply() {
      var query = queryInput ? queryInput.value.trim().toLowerCase() : '';
      var type = typeSelect ? typeSelect.value : '';
      var year = yearSelect ? yearSelect.value : '';

      cards.forEach(function (card) {
        var search = (card.getAttribute('data-search') || '').toLowerCase();
        var cardType = card.getAttribute('data-type') || '';
        var cardYear = card.getAttribute('data-year') || '';
        var visible = true;

        if (query && search.indexOf(query) === -1) {
          visible = false;
        }
        if (type && cardType !== type) {
          visible = false;
        }
        if (!yearMatches(year, cardYear)) {
          visible = false;
        }
        card.hidden = !visible;
      });
    }

    [queryInput, typeSelect, yearSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });

    apply();
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        if (window.Hls) {
          resolve();
        }
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function attachVideo(video, src) {
    if (!src) {
      return Promise.resolve();
    }
    if (video.getAttribute('data-ready') === '1') {
      return Promise.resolve();
    }
    video.setAttribute('data-ready', '1');

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return Promise.resolve();
    }

    function useHls() {
      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        video._hlsInstance = hls;
        return Promise.resolve();
      }
      video.src = src;
      return Promise.resolve();
    }

    if (window.Hls) {
      return useHls();
    }

    return loadScript('https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js')
      .then(useHls)
      .catch(function () {
        video.src = src;
      });
  }

  function bindPlayers() {
    selectAll('[data-player-panel]').forEach(function (panel) {
      var video = panel.querySelector('video[data-stream]');
      var button = panel.querySelector('[data-play-button]');
      if (!video) {
        return;
      }
      var src = video.getAttribute('data-stream');

      function play() {
        attachVideo(video, src).then(function () {
          var attempt = video.play();
          if (attempt && typeof attempt.catch === 'function') {
            attempt.catch(function () {});
          }
        });
      }

      if (button) {
        button.addEventListener('click', play);
      }

      video.addEventListener('play', function () {
        panel.classList.add('is-playing');
      });

      video.addEventListener('pause', function () {
        if (video.currentTime === 0 || video.ended) {
          panel.classList.remove('is-playing');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindMenu();
    bindHero();
    bindFilters();
    bindPlayers();
  });
})();
