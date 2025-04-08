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

// ✅ Fix: Remove menu state on resize to larger screens
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        navLinks.classList.remove('show');
    }
});

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

const phrases = ["...", "hmm", "hmm ...", "???", "uhh", "uhh ...", " / / / ", "maybe ...", "why not?"];
let currentPhrase = "";
let currentChar = 0;
let isDeleting = false;
const display = document.getElementById("trailing-words");

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

const darkToggle = document.getElementById("darkModeToggle");
const icon = darkToggle.querySelector("i");

function setTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    icon.className = isDark ? "fi fi-rr-sun" : "fi fi-rr-moon-stars";
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