(() => {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    /* ---------- Hero 3D network canvas ---------- */
    function initNetworkCanvas() {
        const canvas = document.getElementById('network-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w, h, dpr;
        let nodes = [];
        let rotY = 0, rotX = 0.15;
        let targetTiltX = 0, targetTiltY = 0;
        const NODE_COUNT = window.innerWidth < 768 ? 46 : 90;
        const RADIUS = 260;

        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = canvas.clientWidth;
            h = canvas.clientHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function makeNodes() {
            nodes = [];
            for (let i = 0; i < NODE_COUNT; i++) {
                const phi = Math.acos(-1 + (2 * i) / NODE_COUNT);
                const theta = Math.sqrt(NODE_COUNT * Math.PI) * phi;
                nodes.push({
                    x0: RADIUS * Math.cos(theta) * Math.sin(phi),
                    y0: RADIUS * Math.sin(theta) * Math.sin(phi),
                    z0: RADIUS * Math.cos(phi),
                    pulse: Math.random() * Math.PI * 2,
                });
            }
        }

        function project(p) {
            const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
            const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
            let x = p.x0 * cosY - p.z0 * sinY;
            let z = p.x0 * sinY + p.z0 * cosY;
            let y = p.y0 * cosX - z * sinX;
            z = p.y0 * sinX + z * cosX;
            const perspective = 640 / (640 + z);
            return {
                x: x * perspective,
                y: y * perspective,
                scale: perspective,
                z,
            };
        }

        let raf;
        function tick(t) {
            ctx.clearRect(0, 0, w, h);
            rotY += 0.0011 + targetTiltY * 0.00035;
            rotX += (0.14 + targetTiltX * 0.06 - rotX) * 0.02;

            const cx = w / 2, cy = h * 0.46;
            const projected = nodes.map((p) => {
                const proj = project(p);
                return { ...proj, sx: cx + proj.x, sy: cy + proj.y, pulse: p.pulse };
            });

            // edges: connect near neighbours only, cheap O(n^2) is fine at this N
            ctx.lineWidth = 1;
            for (let i = 0; i < projected.length; i++) {
                for (let j = i + 1; j < projected.length; j++) {
                    const a = projected[i], b = projected[j];
                    const dx = a.sx - b.sx, dy = a.sy - b.sy;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 95) {
                        const depth = (a.scale + b.scale) / 2;
                        const alpha = (1 - dist / 95) * 0.16 * depth;
                        ctx.strokeStyle = `rgba(198,255,77,${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(a.sx, a.sy);
                        ctx.lineTo(b.sx, b.sy);
                        ctx.stroke();
                    }
                }
            }

            projected
                .sort((a, b) => a.z - b.z)
                .forEach((p) => {
                    const r = Math.max(1, 2.1 * p.scale);
                    const glow = 0.35 + 0.25 * Math.sin(t * 0.001 + p.pulse);
                    ctx.beginPath();
                    ctx.fillStyle = `rgba(198,255,77,${0.35 + glow * p.scale})`;
                    ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
                    ctx.fill();
                });

            raf = requestAnimationFrame(tick);
        }

        resize();
        makeNodes();
        if (!reduceMotion) {
            raf = requestAnimationFrame(tick);
        } else {
            tick(0);
        }

        window.addEventListener('resize', () => {
            resize();
        });

        if (!isTouch) {
            window.addEventListener('mousemove', (e) => {
                targetTiltX = (e.clientY / window.innerHeight - 0.5) * 2;
                targetTiltY = (e.clientX / window.innerWidth - 0.5) * 2;
            });
        }
    }

    /* ---------- Reveal on scroll ---------- */
    function initReveal() {
        const targets = document.querySelectorAll('[data-reveal]');
        if (!targets.length) return;
        if (reduceMotion || !('IntersectionObserver' in window)) {
            targets.forEach((el) => el.classList.add('is-visible'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const delay = entry.target.getAttribute('data-reveal-delay');
                    if (delay) entry.target.style.transitionDelay = `${delay}ms`;
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
        targets.forEach((el) => io.observe(el));
    }

    /* ---------- Animated counters ---------- */
    function initCounters() {
        const counters = document.querySelectorAll('[data-count]');
        if (!counters.length) return;
        const animate = (el) => {
            const target = parseFloat(el.getAttribute('data-count'));
            const suffix = el.getAttribute('data-suffix') || '';
            const decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;
            const duration = 1400;
            const start = performance.now();
            if (reduceMotion) {
                el.textContent = target.toFixed(decimals) + suffix;
                return;
            }
            function step(now) {
                const p = Math.min(1, (now - start) / duration);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = (target * eased).toFixed(decimals) + suffix;
                if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        };
        if (!('IntersectionObserver' in window)) {
            counters.forEach(animate);
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animate(entry.target);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach((el) => io.observe(el));
    }

    /* ---------- Skill rings ---------- */
    function initSkillRings() {
        const rings = document.querySelectorAll('.skill-ring');
        if (!rings.length || !('IntersectionObserver' in window)) {
            rings.forEach((r) => r.style.setProperty('--p', r.getAttribute('data-p') || 0));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.setProperty('--p', entry.target.getAttribute('data-p') || 0);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });
        rings.forEach((r) => io.observe(r));
    }

    /* ---------- Timeline draw ---------- */
    function initTimeline() {
        const lines = document.querySelectorAll('.timeline-line');
        if (!lines.length || !('IntersectionObserver' in window)) return;
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.height = '100%';
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        lines.forEach((l) => io.observe(l));
    }

    /* ---------- Card tilt ---------- */
    function initTilt() {
        if (isTouch || reduceMotion) return;
        document.querySelectorAll('.card-tilt').forEach((card) => {
            let rect;
            card.addEventListener('mouseenter', () => { rect = card.getBoundingClientRect(); });
            card.addEventListener('mousemove', (e) => {
                if (!rect) rect = card.getBoundingClientRect();
                const px = (e.clientX - rect.left) / rect.width - 0.5;
                const py = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateZ(0)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
            });
        });
    }

    /* ---------- Magnetic buttons ---------- */
    function initMagnetic() {
        if (isTouch || reduceMotion) return;
        document.querySelectorAll('.magnetic').forEach((btn) => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0, 0)';
            });
        });
    }

    /* ---------- Custom cursor ---------- */
    function initCursor() {
        if (isTouch || reduceMotion) return;
        const dot = document.createElement('div');
        dot.className = 'cursor-dot';
        const ring = document.createElement('div');
        ring.className = 'cursor-ring';
        document.body.append(dot, ring);
        let rx = 0, ry = 0, dx = 0, dy = 0;
        window.addEventListener('mousemove', (e) => {
            dx = e.clientX; dy = e.clientY;
            dot.style.left = `${dx}px`;
            dot.style.top = `${dy}px`;
        });
        (function loop() {
            rx += (dx - rx) * 0.18;
            ry += (dy - ry) * 0.18;
            ring.style.left = `${rx}px`;
            ring.style.top = `${ry}px`;
            requestAnimationFrame(loop);
        })();
        document.querySelectorAll('a, button, .card-tilt, [data-cursor-hover]').forEach((el) => {
            el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
            el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
        });
    }

    /* ---------- Nav: scroll state + active link ---------- */
    function initNav() {
        const navbar = document.getElementById('navbar');
        const navGlass = navbar ? navbar.querySelector('.glass') : null;
        window.addEventListener('scroll', () => {
            if (!navbar || !navGlass) return;
            if (window.scrollY > 40) {
                navbar.classList.add('py-2');
                navGlass.classList.add('bg-black/70');
            } else {
                navbar.classList.remove('py-2');
                navGlass.classList.remove('bg-black/70');
            }
        });

        const sections = document.querySelectorAll('main section[id], header[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        if (sections.length && 'IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        navLinks.forEach((l) => l.classList.remove('active'));
                        const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
                        if (active) active.classList.add('active');
                    }
                });
            }, { rootMargin: '-45% 0px -50% 0px' });
            sections.forEach((s) => io.observe(s));
        }

        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
            mobileMenu.querySelectorAll('a').forEach((link) => {
                link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
            });
        }

        const scrollBtn = document.getElementById('scroll-down-button');
        if (scrollBtn) {
            scrollBtn.addEventListener('click', () => {
                document.getElementById('sobre').scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    /* ---------- i18n ---------- */
    const translations = window.PETI_TRANSLATIONS || {};

    function applyTranslations(lang) {
        document.querySelectorAll('[key-language]').forEach((element) => {
            const key = element.getAttribute('key-language');
            if (translations[lang] && translations[lang][key] !== undefined) {
                element.innerHTML = translations[lang][key];
            }
        });
        document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    }

    function updateToggle(toggleEl, lang) {
        if (!toggleEl) return;
        toggleEl.querySelectorAll('.lang-option').forEach((opt) => {
            opt.classList.toggle('active', opt.dataset.lang === lang);
        });
    }

    function initI18n() {
        let currentLang = 'pt';
        const desktopToggle = document.getElementById('language-toggle');
        const mobileToggle = document.getElementById('language-toggle-mobile');

        function setLang(lang) {
            if (lang === currentLang) return;
            currentLang = lang;
            applyTranslations(lang);
            updateToggle(desktopToggle, lang);
            updateToggle(mobileToggle, lang);
        }

        [desktopToggle, mobileToggle].forEach((toggle) => {
            if (!toggle) return;
            toggle.addEventListener('click', (e) => {
                if (e.target.classList.contains('lang-option')) setLang(e.target.dataset.lang);
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initNetworkCanvas();
        initReveal();
        initCounters();
        initSkillRings();
        initTimeline();
        initTilt();
        initMagnetic();
        initCursor();
        initNav();
        initI18n();
    });
})();
