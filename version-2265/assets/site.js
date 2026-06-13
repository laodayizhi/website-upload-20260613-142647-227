(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    ready(function () {
        setupMenu();
        setupHero();
        setupFilters();
        setupPlayer();
    });

    function setupMenu() {
        var button = document.querySelector('[data-menu-toggle]');
        var nav = document.querySelector('[data-mobile-nav]');
        if (!button || !nav) {
            return;
        }
        button.addEventListener('click', function () {
            nav.classList.toggle('open');
        });
    }

    function setupHero() {
        var hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
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
                slide.classList.toggle('active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === current);
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

    function setupFilters() {
        var zones = Array.prototype.slice.call(document.querySelectorAll('[data-filter-zone]'));
        zones.forEach(function (zone) {
            var input = zone.querySelector('[data-filter-input]');
            var buttons = Array.prototype.slice.call(zone.querySelectorAll('[data-filter-button]'));
            var empty = zone.querySelector('[data-empty-result]');
            var activeTerm = '';

            function normalize(value) {
                return String(value || '').trim().toLowerCase();
            }

            function apply() {
                var query = normalize(input ? input.value : '');
                var cards = Array.prototype.slice.call(zone.querySelectorAll('[data-movie-card]'));
                var visible = 0;
                cards.forEach(function (card) {
                    var haystack = normalize([
                        card.getAttribute('data-title'),
                        card.getAttribute('data-year'),
                        card.getAttribute('data-region'),
                        card.getAttribute('data-genre'),
                        card.getAttribute('data-tags')
                    ].join(' '));
                    var matchedQuery = !query || haystack.indexOf(query) !== -1;
                    var matchedTerm = !activeTerm || haystack.indexOf(normalize(activeTerm)) !== -1;
                    var show = matchedQuery && matchedTerm;
                    card.style.display = show ? '' : 'none';
                    if (show) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle('show', visible === 0);
                }
            }

            if (input) {
                input.addEventListener('input', apply);
            }

            buttons.forEach(function (button) {
                button.addEventListener('click', function () {
                    activeTerm = button.getAttribute('data-filter-button') || '';
                    buttons.forEach(function (item) {
                        item.classList.toggle('active', item === button);
                    });
                    apply();
                });
            });

            apply();
        });
    }

    function setupPlayer() {
        var video = document.getElementById('movie-player');
        if (!video) {
            return;
        }
        var source = video.getAttribute('data-src');
        var button = document.querySelector('[data-player-button]');
        var message = document.querySelector('[data-player-message]');
        var hls = null;
        var isReady = false;

        function showMessage(text) {
            if (!message) {
                return;
            }
            message.textContent = text || '';
            message.classList.toggle('show', Boolean(text));
        }

        function attachSource() {
            if (isReady) {
                return Promise.resolve();
            }
            if (!source) {
                showMessage('当前影片播放源暂不可用');
                return Promise.reject(new Error('missing source'));
            }
            if (window.Hls && window.Hls.isSupported()) {
                return new Promise(function (resolve, reject) {
                    hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hls.loadSource(source);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        isReady = true;
                        showMessage('');
                        resolve();
                    });
                    hls.on(window.Hls.Events.ERROR, function (event, data) {
                        if (!data || !data.fatal) {
                            return;
                        }
                        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                            showMessage('网络波动，正在重新加载');
                            hls.startLoad();
                        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                            showMessage('媒体解析异常，正在恢复播放');
                            hls.recoverMediaError();
                        } else {
                            showMessage('当前浏览器无法播放该视频源');
                            reject(new Error('fatal hls error'));
                        }
                    });
                });
            }
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
                isReady = true;
                return Promise.resolve();
            }
            showMessage('当前浏览器不支持 HLS 播放');
            return Promise.reject(new Error('hls unsupported'));
        }

        function play() {
            attachSource().then(function () {
                return video.play();
            }).then(function () {
                if (button) {
                    button.classList.add('hidden');
                }
                showMessage('');
            }).catch(function () {
                if (button) {
                    button.classList.remove('hidden');
                }
            });
        }

        if (button) {
            button.addEventListener('click', play);
        }

        video.addEventListener('click', function () {
            if (video.paused) {
                play();
            }
        });

        video.addEventListener('play', function () {
            if (button) {
                button.classList.add('hidden');
            }
        });

        video.addEventListener('pause', function () {
            if (button && video.currentTime === 0) {
                button.classList.remove('hidden');
            }
        });

        window.addEventListener('beforeunload', function () {
            if (hls) {
                hls.destroy();
            }
        });
    }
}());
