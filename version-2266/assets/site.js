import { H as Hls } from "./hls-vendor-dru42stk.js";

const menuButton = document.querySelector("[data-mobile-menu-button]");
const menuPanel = document.querySelector("[data-mobile-menu-panel]");

if (menuButton && menuPanel) {
    menuButton.addEventListener("click", () => {
        menuPanel.classList.toggle("is-open");
    });
}

function setupHeroCarousel() {
    const carousel = document.querySelector("[data-hero-carousel]");
    if (!carousel) {
        return;
    }

    const slides = Array.from(carousel.querySelectorAll("[data-hero-slide]"));
    const dots = Array.from(carousel.querySelectorAll("[data-hero-dot]"));
    const previous = carousel.querySelector("[data-hero-prev]");
    const next = carousel.querySelector("[data-hero-next]");
    let current = 0;
    let timer = null;

    function showSlide(index) {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle("active", slideIndex === current);
        });
        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle("active", dotIndex === current);
        });
    }

    function startAutoPlay() {
        stopAutoPlay();
        timer = window.setInterval(() => showSlide(current + 1), 6000);
    }

    function stopAutoPlay() {
        if (timer) {
            window.clearInterval(timer);
            timer = null;
        }
    }

    previous?.addEventListener("click", () => {
        showSlide(current - 1);
        startAutoPlay();
    });

    next?.addEventListener("click", () => {
        showSlide(current + 1);
        startAutoPlay();
    });

    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            showSlide(index);
            startAutoPlay();
        });
    });

    carousel.addEventListener("mouseenter", stopAutoPlay);
    carousel.addEventListener("mouseleave", startAutoPlay);
    showSlide(0);
    startAutoPlay();
}

function setupFilters() {
    const toolbar = document.querySelector("[data-filter-toolbar]");
    const grid = document.querySelector("[data-filter-grid]");

    if (!toolbar || !grid) {
        return;
    }

    const cards = Array.from(grid.querySelectorAll("[data-movie-card]"));
    const input = toolbar.querySelector("[data-filter-input]");
    const yearSelect = toolbar.querySelector("[data-filter-year]");
    const categorySelect = toolbar.querySelector("[data-filter-category]");
    const count = toolbar.querySelector("[data-filter-count]");
    const empty = document.querySelector("[data-empty-state]");
    const params = new URLSearchParams(window.location.search);
    const queryFromUrl = params.get("q") || "";

    if (input && queryFromUrl) {
        input.value = queryFromUrl;
    }

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function update() {
        const keyword = normalize(input?.value);
        const year = normalize(yearSelect?.value);
        const category = normalize(categorySelect?.value);
        let visible = 0;

        cards.forEach((card) => {
            const haystack = normalize([
                card.dataset.title,
                card.dataset.category,
                card.dataset.region,
                card.dataset.year,
                card.dataset.type,
                card.dataset.tags,
            ].join(" "));
            const matchesKeyword = !keyword || haystack.includes(keyword);
            const matchesYear = !year || normalize(card.dataset.year) === year;
            const matchesCategory = !category || normalize(card.dataset.category) === category;
            const shouldShow = matchesKeyword && matchesYear && matchesCategory;

            card.style.display = shouldShow ? "" : "none";
            if (shouldShow) {
                visible += 1;
            }
        });

        if (count) {
            count.textContent = `显示 ${visible} / ${cards.length} 部`;
        }

        if (empty) {
            empty.classList.toggle("show", visible === 0);
        }
    }

    input?.addEventListener("input", update);
    yearSelect?.addEventListener("change", update);
    categorySelect?.addEventListener("change", update);
    update();
}

function setupPlayers() {
    const players = Array.from(document.querySelectorAll(".js-hls-video"));

    players.forEach((video) => {
        const source = video.dataset.videoSrc;
        const shell = video.closest(".video-shell");
        const startButton = shell?.querySelector(".js-player-start");
        const status = shell?.querySelector("[data-player-status]");
        let initialized = false;
        let initializing = false;
        let hls = null;

        function showStatus(message, persistent = false) {
            if (!status) {
                return;
            }

            status.textContent = message;
            status.classList.add("show");

            if (!persistent) {
                window.setTimeout(() => {
                    status.classList.remove("show");
                }, 3500);
            }
        }

        function initialize() {
            if (initialized || initializing) {
                return Promise.resolve();
            }

            initializing = true;
            showStatus("正在加载播放源...");

            return new Promise((resolve) => {
                if (!source) {
                    showStatus("未找到可用播放源", true);
                    initializing = false;
                    resolve();
                    return;
                }

                if (Hls.isSupported()) {
                    hls = new Hls({
                        enableWorker: true,
                        lowLatencyMode: true,
                    });
                    hls.loadSource(source);
                    hls.attachMedia(video);
                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        initialized = true;
                        initializing = false;
                        showStatus("播放源加载完成");
                        resolve();
                    });
                    hls.on(Hls.Events.ERROR, (event, data) => {
                        if (!data || !data.fatal) {
                            return;
                        }

                        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                            showStatus("网络错误，正在尝试恢复...", true);
                            hls.startLoad();
                            return;
                        }

                        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                            showStatus("媒体错误，正在尝试恢复...", true);
                            hls.recoverMediaError();
                            return;
                        }

                        showStatus("无法播放视频，请稍后再试", true);
                    });
                    return;
                }

                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = source;
                    initialized = true;
                    initializing = false;
                    resolve();
                    return;
                }

                showStatus("当前浏览器不支持 HLS 视频播放", true);
                initializing = false;
                resolve();
            });
        }

        async function playVideo() {
            await initialize();
            startButton?.classList.add("is-hidden");
            try {
                await video.play();
            } catch (error) {
                showStatus("请再次点击播放器开始播放");
            }
        }

        startButton?.addEventListener("click", playVideo);

        video.addEventListener("play", () => {
            startButton?.classList.add("is-hidden");
        });

        video.addEventListener("pause", () => {
            if (video.currentTime === 0 || video.ended) {
                startButton?.classList.remove("is-hidden");
            }
        });

        window.addEventListener("beforeunload", () => {
            if (hls) {
                hls.destroy();
            }
        });
    });
}

setupHeroCarousel();
setupFilters();
setupPlayers();
