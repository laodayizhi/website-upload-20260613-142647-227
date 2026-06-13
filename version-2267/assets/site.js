(function() {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
            return;
        }
        callback();
    }

    function setupMenu() {
        var button = document.querySelector("[data-menu-toggle]");
        var menu = document.querySelector("[data-mobile-nav]");
        if (!button || !menu) {
            return;
        }
        button.addEventListener("click", function() {
            menu.classList.toggle("open");
        });
    }

    function setupHero() {
        var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
        if (!slides.length) {
            return;
        }
        var index = 0;
        var timer = null;

        function show(next) {
            index = (next + slides.length) % slides.length;
            slides.forEach(function(slide, current) {
                slide.classList.toggle("active", current === index);
            });
            dots.forEach(function(dot, current) {
                dot.classList.toggle("active", current === index);
            });
        }

        function start() {
            timer = window.setInterval(function() {
                show(index + 1);
            }, 5200);
        }

        dots.forEach(function(dot) {
            dot.addEventListener("click", function() {
                window.clearInterval(timer);
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });

        start();
    }

    function setupFilters() {
        var inputs = Array.prototype.slice.call(document.querySelectorAll("[data-search-input]"));
        var grid = document.querySelector("[data-card-grid]");
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
        var chips = Array.prototype.slice.call(document.querySelectorAll("[data-year-filter]"));
        var sort = document.querySelector("[data-sort-select]");
        var empty = document.querySelector("[data-empty-state]");
        var state = {
            query: "",
            year: "all",
            sort: sort ? sort.value : "year"
        };

        if (!cards.length) {
            return;
        }

        function matchYear(year) {
            var value = Number(year);
            if (state.year === "all") {
                return true;
            }
            if (state.year === "classic") {
                return value < 2010;
            }
            return value >= Number(state.year);
        }

        function apply() {
            var visible = 0;
            var q = state.query.trim().toLowerCase();
            cards.forEach(function(card) {
                var content = (card.getAttribute("data-text") || "").toLowerCase();
                var show = (!q || content.indexOf(q) !== -1) && matchYear(card.getAttribute("data-year"));
                card.style.display = show ? "" : "none";
                if (show) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.classList.toggle("show", visible === 0);
            }
        }

        function sortCards(value) {
            if (!grid) {
                return;
            }
            var sorted = cards.slice().sort(function(a, b) {
                if (value === "title") {
                    return (a.getAttribute("data-title") || "").localeCompare(b.getAttribute("data-title") || "", "zh-CN");
                }
                if (value === "heat") {
                    return Number(b.getAttribute("data-heat")) - Number(a.getAttribute("data-heat"));
                }
                return Number(b.getAttribute("data-year")) - Number(a.getAttribute("data-year"));
            });
            sorted.forEach(function(card) {
                grid.appendChild(card);
            });
        }

        inputs.forEach(function(input) {
            input.addEventListener("input", function() {
                state.query = input.value;
                inputs.forEach(function(other) {
                    if (other !== input) {
                        other.value = input.value;
                    }
                });
                apply();
            });
        });

        chips.forEach(function(chip) {
            chip.addEventListener("click", function() {
                chips.forEach(function(item) {
                    item.classList.remove("active");
                });
                chip.classList.add("active");
                state.year = chip.getAttribute("data-year-filter") || "all";
                apply();
            });
        });

        if (sort) {
            sort.addEventListener("change", function() {
                state.sort = sort.value;
                sortCards(state.sort);
                apply();
            });
        }

        sortCards(state.sort);
        apply();
    }

    window.initPlayer = function(source) {
        var video = document.querySelector("[data-player]");
        var trigger = document.querySelector("[data-play]");
        if (!video || !trigger || !source) {
            return;
        }

        var attached = false;

        function attach() {
            if (attached) {
                return;
            }
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
            } else if (window.Hls) {
                var hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(source);
                hls.attachMedia(video);
            } else {
                video.src = source;
            }
            attached = true;
        }

        function play() {
            attach();
            trigger.classList.add("is-hidden");
            video.controls = true;
            var result = video.play();
            if (result && typeof result.catch === "function") {
                result.catch(function() {});
            }
        }

        trigger.addEventListener("click", play);
        video.addEventListener("click", function() {
            if (video.paused) {
                play();
            }
        });
    };

    ready(function() {
        setupMenu();
        setupHero();
        setupFilters();
    });
})();
