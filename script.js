const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
    // Toggle menu open/close
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('show');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('show');
        });
    });

    // Close menu when clicking outside of nav
    document.addEventListener('click', (e) => {
        const isClickInsideMenu = navLinks.contains(e.target);
        const isClickOnToggle = navToggle.contains(e.target);

        if (!isClickInsideMenu && !isClickOnToggle) {
            navLinks.classList.remove('show');
        }
    });

    // Remove menu state on resize to larger screens
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('show');
        }
    });
}

// Fade elements on scroll
const fadeEls = document.querySelectorAll('.fade-in-on-scroll');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        } else {
            entry.target.classList.remove('visible');
        }
    });
}, {
    threshold: 0.1
});

fadeEls.forEach(el => observer.observe(el));


// Chevron scroll
document.addEventListener("DOMContentLoaded", () => {
    const chevron = document.getElementById("scrollChevron");

    if (chevron) {
        chevron.addEventListener("click", (e) => {
            e.preventDefault();

            const target = document.getElementById("projects");
            const offset = 75;

            if (target) {
                const top = target.getBoundingClientRect().top + window.scrollY - offset;

                window.scrollTo({
                    top: top,
                    behavior: "smooth"
                });
            }
        });
    }
});

// Text glow effect
document.addEventListener("DOMContentLoaded", () => {
    const text = "Featured Projects";
    const container = document.getElementById("glowTarget");

    if (!container) return;

    container.innerHTML = "";

    text.split("").forEach((char, index) => {
        const span = document.createElement("span");
        span.textContent = char === " " ? "\u00A0" : char; // non-breaking space
        span.classList.add("glow-letter");
        span.dataset.index = index;
        container.appendChild(span);
    });

    function animateGlow(time) {
        const letters = document.querySelectorAll(".glow-letter");

        const glowColor = getComputedStyle(document.documentElement)
            .getPropertyValue("--letter-glow")
            .trim();

        letters.forEach((el, i) => {
            const phase = i * 0.1;
            const glow = 1.3 * Math.sin(time / 600 - phase);
            const intensity = Math.max(glow, 0);

            const blur = intensity * 12;
            const alpha = 0.4 + intensity * 0.6;

            // Ensure rgb -> rgba conversion is safe
            const rgbaColor = glowColor.startsWith("rgb(") ?
                glowColor.replace("rgb", "rgba").replace(")", `, ${alpha})`) :
                glowColor; // fallback in case of unexpected format

            el.style.textShadow = `0 0 ${blur}px ${rgbaColor}`;
        });

        requestAnimationFrame(animateGlow);
    }

    requestAnimationFrame(animateGlow);
});



const display = document.getElementById("trailing-words");
if (display) {

    const phrases = ["...", "hmm", "hmm ...", "???", "uhh", "uhh ...", " / / / ", "maybe ...", "why not?"];
    let currentPhrase = "";
    let currentChar = 0;
    let isDeleting = false;

    function pickRandomPhrase(exclude) {
        let next;
        do {
            next = phrases[Math.floor(Math.random() * phrases.length)];
        } while (next === exclude); // prevent repeating the same one
        return next;
    }

    function typeLoop() {
        const fullText = currentPhrase;

        if (isDeleting) {
            currentChar--;
        } else {
            currentChar++;
        }

        display.textContent = fullText.substring(0, currentChar);

        let delay = isDeleting ? 180 : 360;

        if (!isDeleting && currentChar === fullText.length) {
            delay = 2000; // pause after finishing
            isDeleting = true;
        } else if (isDeleting && currentChar === 0) {
            isDeleting = false;
            currentPhrase = pickRandomPhrase(currentPhrase); // pick new one
            delay = 1000; // pause before typing new
        }

        setTimeout(typeLoop, delay);
    }

    // Start with a random one
    currentPhrase = pickRandomPhrase("");
    typeLoop();
}


// Default theme: dark mode
if (!localStorage.getItem("theme")) {
    localStorage.setItem("theme", "dark");
}

const darkToggle = document.getElementById("darkModeToggle");
const darkModeIcon = document.getElementById("darkModeIcon");

if (darkToggle) {
    function setTheme(isDark) {
        document.body.classList.toggle("dark-mode", isDark);

        // Update the visibility of the SVG paths
        const darkModePath = darkModeIcon.querySelector(".dark-mode-path");
        const lightModePath = darkModeIcon.querySelector(".light-mode-path");

        if (isDark) {
            darkModePath.style.display = "none";
            lightModePath.style.display = "block";
        } else {
            darkModePath.style.display = "block";
            lightModePath.style.display = "none";
        }

        // Save the theme to localStorage
        localStorage.setItem("theme", isDark ? "dark" : "light");
    }

    darkToggle.addEventListener("click", () => {
        const isDark = !document.body.classList.contains("dark-mode");
        setTheme(isDark);
    });

    window.addEventListener("DOMContentLoaded", () => {
        const savedTheme = localStorage.getItem("theme");
        setTheme(savedTheme === "dark");
    });
}


window.addEventListener("DOMContentLoaded", () => {
    // 1) vertical (your existing code)
    const swiper = new Swiper(".swiper", {
        direction: "vertical",
        slidesPerView: 1,
        spaceBetween: 16,
        grabCursor: true,
        mousewheel: true,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
    });

    // ➤ NEW: horizontal Swiper
    // 2) horizontal swiper – now with a 16px gap
    new Swiper(".swiper-horizontal", {
        direction: "horizontal",
        loop: true,
        spaceBetween: 16,   // ← here’s your horizontal gap
        pagination: {
            el: ".swiper-horizontal .swiper-pagination",
            clickable: true,
        },
        navigation: {
            nextEl: ".swiper-horizontal .swiper-button-next",
            prevEl: ".swiper-horizontal .swiper-button-prev",
        },
    });
});




// KNURLING IMAGE SCROLLER INIT
function initInfiniteCarousel({
    sliderSelector = '#slider',
    trackSelector = '#track',
    knurlingSelector = '#knurling',
    imageUrls = []
} = {}) {
    const slider = document.querySelector(sliderSelector);
    const track = document.querySelector(trackSelector);
    const knurling = document.querySelector(knurlingSelector);

    // Bail if missing required elements or no images provided
    if (!slider || !track || !knurling || imageUrls.length === 0) return;

    // Populate track with images (duplicated for infinite loop)
    [...imageUrls, ...imageUrls].forEach((src, index) => {
        const container = document.createElement('div');
        container.className = 'carrousel-image-container';
        container.style.backgroundImage = `url(${src})`;

        const caption = document.createElement('div');
        caption.className = 'carrousel-caption';
        caption.textContent = `Figure ${index % imageUrls.length + 1}`;

        container.appendChild(caption);
        track.appendChild(container);
    });

    // Constants
    const SLIDE_W = 300;
    const TOTAL_W = SLIDE_W * imageUrls.length;
    const FRICTION = 0.95;
    const MIN_VELOCITY = 0.2;
    const MAX_VELOCITY = 30;
    const WHEEL_MULT = -0.1;

    // State
    let offset = 0;
    let autoSpeed = 0.7;
    let isDragging = false;
    let autoPaused = false;
    let velocity = 0;
    let dragStartX, dragOffset, prevOffset;
    let resumeTimer = null;

    // Core animation loop
    function animate() {
        if (isDragging) { /* manual control */ }
        else if (Math.abs(velocity) > MIN_VELOCITY) {
            offset += velocity;
            velocity *= FRICTION;
        }
        else if (!autoPaused) {
            offset += autoSpeed;
        }

        // wrap offset
        if (offset >= TOTAL_W) offset -= TOTAL_W;
        if (offset < 0) offset += TOTAL_W;

        // apply transforms
        track.style.transform = `translateX(${-offset}px)`;
        knurling.style.backgroundPosition = `${-offset}px 0`;

        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    // Pointer event handlers
    function startDrag(x) {
        isDragging = true;
        autoPaused = true;
        velocity = 0;
        dragStartX = x;
        dragOffset = offset;
        prevOffset = offset;
        slider.classList.add('grabbing');
        knurling.classList.add('grabbing');
        clearTimeout(resumeTimer);
    }

    function doDrag(x) {
        if (!isDragging) return;
        const dx = x - dragStartX;
        offset = (dragOffset - dx + TOTAL_W) % TOTAL_W;

        // compute & clamp velocity
        velocity = offset - prevOffset;
        velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocity));
        prevOffset = offset;
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        slider.classList.remove('grabbing');
        knurling.classList.remove('grabbing');
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => { autoPaused = false; }, 1000);
    }

    // Wire up mouse and touch start
    [slider, knurling].forEach(el => {
        el.addEventListener('mousedown', e => startDrag(e.pageX));
        el.addEventListener('touchstart', e => startDrag(e.touches[0].pageX));
        // Element-level touchmove: only prevent default when dragging
        el.addEventListener('touchmove', e => {
            if (!isDragging) return;
            e.preventDefault();
            doDrag(e.touches[0].pageX);
        }, { passive: false });
    });

    // Global move/end
    window.addEventListener('mousemove', e => doDrag(e.pageX));
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);

    // Wheel control on slider
    slider.addEventListener('wheel', e => {
        e.preventDefault();
        autoPaused = true;
        clearTimeout(resumeTimer);

        const delta = e.deltaY * WHEEL_MULT;
        offset = (offset + delta + TOTAL_W) % TOTAL_W;
        velocity = delta;

        track.style.transform = `translateX(${-offset}px)`;
        knurling.style.backgroundPosition = `${-offset}px 0`;

        resumeTimer = setTimeout(() => { autoPaused = false; }, 1000);
    });
}

// Initialize it from your main JS
initInfiniteCarousel({
    sliderSelector: '#slider',
    trackSelector: '#track',
    knurlingSelector: '#knurling',
    imageUrls: [
        'assets/cool-images/flocking-boids.png',
        'assets/cool-images/sinusoidal-function.png',
        'assets/cool-images/conways-game.png',
        'assets/cool-images/mandelbrot-set.png',
        'assets/cool-images/curve-fitter.png',
        'assets/cool-images/machine-pong.png',
        'assets/cool-images/training-pong.png',
        'assets/cool-images/quadtree-hi.png',
        'assets/cool-images/hamiltonian-solver.png',
        'assets/cool-images/gravity-simulation.png',
    ]
});
