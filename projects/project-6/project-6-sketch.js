let cols, rows;
let s = 0.5;
let w = 50;
let h = 50;

// integration starts here
// variables to keep track
let canvasHeight = 400;
let canvasWidth = 400;
let darkMode = document.body.classList.contains("dark-mode");
let currentBackground = 0;

let polynomial_data_coefficients = [];
let randomized_data = [];

// function for resizing
function windowResized() {
    container = document.getElementById('canvas-container');
    canvasWidth = container.getBoundingClientRect().width;
    resizeCanvas(canvasWidth, canvasHeight);
}

function setup() {
    // start up
    container = document.getElementById('canvas-container');
    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    windowResized();
    // integration ends here

    // Initialize polynomial coefficients
    randomize_polynomial_data_coefficients(5);

    // Generate data after coefficients are set
    generate_data(1000);

    console.log("Coefficients:", polynomial_data_coefficients);
    console.log("Generated Data:", randomized_data);
}

function draw() {
    darkMode = document.body.classList.contains("dark-mode");
    if (darkMode) {
        currentBackground = lerp(currentBackground, 0, 0.1);
    } else {
        currentBackground = lerp(currentBackground, 200, 0.1);
    }

    background(currentBackground);

    show_data(0, 0, width, height);
}

function error_function() {
    let error = 0;
    for (let i = 0; i < randomized_data.length; i++) {
        let x = randomized_data[i].x;
        let y = randomized_data[i].y;
        let predictedY = actual_polynomial(x);
        error += pow(y - predictedY, 2);
    }
    return error / randomized_data.length;
}

function show_data(x, y, w, h) {
    if (randomized_data.length === 0) return;

    // Find the actual min and max values for x and y
    let xValues = randomized_data.map(point => point.x);
    let yValues = randomized_data.map(point => point.y);
    let minX = Math.min(...xValues);
    let maxX = Math.max(...xValues);
    let minY = Math.min(...yValues);
    let maxY = Math.max(...yValues);

    // Adjust min and max to center x=0 and y=0
    let xRange = Math.max(Math.abs(minX), Math.abs(maxX));
    let yRange = Math.max(Math.abs(minY), Math.abs(maxY));
    minX = -xRange;
    maxX = xRange;
    minY = -yRange;
    maxY = yRange;

    // Draw axis lines at x=0 and y=0
    stroke(150);
    strokeWeight(1);
    let axisX = map(0, minX, maxX, x, x + w);
    let axisY = map(0, minY, maxY, y + h, y);
    line(axisX, y, axisX, y + h); // y-axis
    line(x, axisY, x + w, axisY); // x-axis

    // Draw the actual polynomial line in blue
    stroke(0, 0, 255);
    strokeWeight(2);
    noFill();
    beginShape();
    for (let px = x; px <= x + w; px++) {
        let graphX = map(px, x, x + w, minX, maxX);
        let graphY = actual_polynomial(graphX);
        let mappedY = map(graphY, minY, maxY, y + h, y);
        vertex(px, mappedY);
    }
    endShape();

    // Plot the data points
    stroke(255);
    strokeWeight(2);
    for (let i = 0; i < randomized_data.length; i++) {
        let mappedX = map(randomized_data[i].x, minX, maxX, x, x + w);
        let mappedY = map(randomized_data[i].y, minY, maxY, y + h, y);
        point(mappedX, mappedY);
    }

}

function randomize_polynomial_data_coefficients(length = 5) {
    polynomial_data_coefficients = [];
    for (let i = 0; i < length; i++) {
        // Use a wider range and randomGaussian for more variation
        let coefficient = randomGaussian(0, 5); // Mean 0, standard deviation 5
        polynomial_data_coefficients[i] = coefficient;
    }

    // Ensure the highest-degree term is significant for more dramatic curves
    polynomial_data_coefficients[length - 1] = random(-10, 10);
}

function actual_polynomial(x) {
    let y = 0;
    for (let i = 0; i < polynomial_data_coefficients.length; i++) {
        y += polynomial_data_coefficients[i] * pow(x, i);
    }
    return y;
}

function generate_data(length = 100) {
    randomized_data = [];
    for (let i = 0; i < length; i++) {
        let x = map(i, 0, length, -5, 5) + random(-1, 1);
        let y = actual_polynomial(x) + random(-100, 100);
        randomized_data.push({ x: x, y: y });
    }
}

function mousePressed() {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        randomize_polynomial_data_coefficients(5);
        generate_data(1000);
    }
}

