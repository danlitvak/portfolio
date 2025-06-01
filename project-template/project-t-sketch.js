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
    canvasHeight = canvasWidth * 0.5; // square canvas
    resizeCanvas(canvasWidth, canvasHeight);
}

let test_class_loaded = false;

function setup() {
    // start up
    container = document.getElementById('canvas-container');
    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    windowResized();
    // integration ends here
    load_test_class();
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

    textAlign(CENTER, CENTER);
    textSize(32);
    fill(255 - currentBackground); // Adjust text color based on background
    noStroke();
    text("Teplate Project", width / 2, height / 2);
    textSize(16);
    if (test_class_loaded) {
        text("Test class loaded", width / 2, height / 2 + 40);
    } else {
        text("Test class not loaded", width / 2, height / 2 + 40);
    }
}

function draw() {
    draw_background();
}
