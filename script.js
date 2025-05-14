const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

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

// Remove menu state on resize to larger screens (not working ❌)
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        navLinks.classList.remove('show');
    }
});

// Fade elements on scroll
const fadeEls = document.querySelectorAll('.fade-in-on-scroll');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // fade only once
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

            const target = document.getElementById("about");
            const offset = 50;

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


// swiper
window.addEventListener("DOMContentLoaded", () => {
    const swiper = new Swiper(".swiper", {
        direction: "vertical",
        slidesPerView: 1, // Changed from "auto" to 1 to fix height issue
        spaceBetween: 16,
        grabCursor: true,
        mousewheel: true,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        // navigation: {
        //     nextEl: '.swiper-button-next',
        //     prevEl: '.swiper-button-prev',
        // },
    });
});