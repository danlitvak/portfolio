// integration starts here
// variables to keep track
let canvasHeight = 400;
let canvasWidth = 400;
let darkMode = document.body.classList.contains("dark-mode");
let currentBackground = 0;

// function for resizing
function windowResized() {
    container = document.getElementById('canvas-container');
    canvasWidth = container.getBoundingClientRect().width;
    canvasHeight = canvasWidth; // square canvas
    resizeCanvas(canvasWidth, canvasHeight);
}

function setup() {
    // start up
    container = document.getElementById('canvas-container');
    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    windowResized();
    // integration ends here
}

function draw_background() {
    // Handle dark mode background transition
    darkMode = document.body.classList.contains("dark-mode");
    if (darkMode) {
        currentBackground = lerp(currentBackground, 0, 0.1);
    } else {
        currentBackground = lerp(currentBackground, 200, 0.1);
    }

    background(currentBackground);
}

function draw() {
    draw_background();
}
