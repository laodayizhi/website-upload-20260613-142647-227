function ready(callback) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", callback);
    } else {
        callback();
    }
}

function setupMobileNav() {
    var toggle = document.querySelector("[data-mobile-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!toggle || !nav) {
        return;
    }
    toggle.addEventListener("click", function () {
        nav.classList.toggle("is-open");
    });
}

function setupSearchForms() {
    document.querySelectorAll("[data-search-form]").forEach(function (form) {
        form.addEventListener("submit", function (event) {
            var input = form.querySelector("input[name='q']");
            var value = input ? input.value.trim() : "";
            if (!value) {
                event.preventDefault();
                return;
            }
            var target = form.getAttribute("data-target") || form.getAttribute("action") || "search.html";
            event.preventDefault();
            window.location.href = target + "?q=" + encodeURIComponent(value);
        });
    });
}

function setupHeroCarousel() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    if (!slides.length) {
        return;
    }
    var current = 0;
    var timer = null;
    function show(index) {
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
            slide.classList.toggle("is-active", i === current);
        });
        dots.forEach(function (dot, i) {
            dot.classList.toggle("is-active", i === current);
        });
    }
    function start() {
        timer = window.setInterval(function () {
            show(current + 1);
        }, 5200);
    }
    dots.forEach(function (dot, index) {
        dot.addEventListener("click", function () {
            if (timer) {
                window.clearInterval(timer);
            }
            show(index);
            start();
        });
    });
    show(0);
    start();
}

function setupCardFilter() {
    var input = document.querySelector("[data-filter-input]");
    var chips = Array.prototype.slice.call(document.querySelectorAll("[data-filter-value]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
    if (!cards.length) {
        return;
    }
    var filterValue = "all";
    function apply() {
        var query = input ? input.value.trim().toLowerCase() : "";
        cards.forEach(function (card) {
            var keywords = (card.getAttribute("data-keywords") || "").toLowerCase();
            var year = card.getAttribute("data-year") || "";
            var type = card.getAttribute("data-type") || "";
            var matchQuery = !query || keywords.indexOf(query) !== -1;
            var matchFilter = filterValue === "all" || year === filterValue || type.indexOf(filterValue) !== -1;
            card.style.display = matchQuery && matchFilter ? "" : "none";
        });
    }
    if (input) {
        input.addEventListener("input", apply);
    }
    chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
            chips.forEach(function (item) {
                item.classList.remove("is-active");
            });
            chip.classList.add("is-active");
            filterValue = chip.getAttribute("data-filter-value") || "all";
            apply();
        });
    });
}

function getQuery(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || "";
}

function setupSearchPage() {
    var results = document.querySelector("[data-search-results]");
    var input = document.querySelector("[data-search-page-input]");
    var button = document.querySelector("[data-search-page-button]");
    if (!results || typeof SEARCH_MOVIES === "undefined") {
        return;
    }
    var original = getQuery("q");
    if (input) {
        input.value = original;
    }
    function render(query) {
        var q = (query || "").trim().toLowerCase();
        if (!q) {
            results.innerHTML = '<div class="search-results-empty">输入片名、地区、年份或题材，即可查看相关影片。</div>';
            return;
        }
        var matched = SEARCH_MOVIES.filter(function (movie) {
            return movie.keywords.toLowerCase().indexOf(q) !== -1;
        }).slice(0, 120);
        if (!matched.length) {
            results.innerHTML = '<div class="search-results-empty">暂无匹配内容，可尝试更换关键词。</div>';
            return;
        }
        results.innerHTML = matched.map(function (movie) {
            return '<article class="movie-card" data-movie-card>' +
                '<a class="movie-cover" href="' + movie.href + '">' +
                    '<img src="' + movie.cover + '" alt="' + movie.title + '" loading="lazy">' +
                    '<span class="type-badge">' + movie.type + '</span>' +
                    '<span class="cover-glow"></span>' +
                '</a>' +
                '<div class="movie-body">' +
                    '<h2><a href="' + movie.href + '">' + movie.title + '</a></h2>' +
                    '<div class="movie-meta"><span>' + movie.year + '</span><span>' + movie.region + '</span><span>' + movie.category + '</span></div>' +
                    '<p>' + movie.text + '</p>' +
                    '<div class="tag-row"><span>' + movie.genre + '</span></div>' +
                '</div>' +
            '</article>';
        }).join("");
    }
    if (button) {
        button.addEventListener("click", function () {
            render(input ? input.value : "");
        });
    }
    if (input) {
        input.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                render(input.value);
            }
        });
    }
    render(original);
}

function initMoviePlayer(videoId, layerId, buttonId, source) {
    var video = document.getElementById(videoId);
    var layer = document.getElementById(layerId);
    var button = document.getElementById(buttonId);
    if (!video || !source) {
        return;
    }
    var loaded = false;
    function loadAndPlay() {
        if (!loaded) {
            loaded = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
            } else if (window.Hls && window.Hls.isSupported()) {
                var hls = new Hls({ enableWorker: true });
                hls.loadSource(source);
                hls.attachMedia(video);
            } else {
                video.src = source;
            }
            video.setAttribute("controls", "controls");
        }
        if (layer) {
            layer.classList.add("is-hidden");
        }
        var playResult = video.play();
        if (playResult && typeof playResult.catch === "function") {
            playResult.catch(function () {});
        }
    }
    if (button) {
        button.addEventListener("click", loadAndPlay);
    }
    video.addEventListener("click", function () {
        if (!loaded || video.paused) {
            loadAndPlay();
        }
    });
}

ready(function () {
    setupMobileNav();
    setupSearchForms();
    setupHeroCarousel();
    setupCardFilter();
    setupSearchPage();
});
