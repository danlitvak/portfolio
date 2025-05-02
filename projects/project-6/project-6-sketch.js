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

let polynomial_length = 5; // degree of polynomial
let data_length = 300; // number of data points
let data_range = 3; // range of x values for data generation
let speed = 100; // speed of the AI learning process

let polynomial_data_coefficients = [];
let randomized_data = [];
let ai_polynomial_coefficients = [];

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

    // randomize polynomial coefficients for AI
    randomize_polynomial_data_coefficients(polynomial_length);

    // Initialize AI polynomial coefficients
    ai_polynomial_coefficients = polynomial_data_coefficients.slice(0);

    // Initialize polynomial coefficients for the actual polynomial
    randomize_polynomial_data_coefficients(polynomial_length);

    // Generate data after coefficients are set
    generate_data(data_length, data_range);

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
    show_actual_error();
    show_ai_error();
    display_coefficients();

    for (let s = 0; s < speed; s++) {
        let dx = 0.0001; // small adjustment for the coefficients
        let learning_rate = 0.001; // learning rate for the adjustment
        let max_gradient = 1; // maximum gradient to prevent blowup

        let tweaks = [];

        // begin to fix the AI polynomial coefficients
        for (let i = 0; i < ai_polynomial_coefficients.length; i++) {
            // previous logic: random() < 0.05 && error_percent_difference > 0.1
            if (false) {
                // add some noise to the coefficients only if the error is high
                tweaks.push({ error: randomGaussian(0, 0.01), index: i });
            } else {
                let error_before = error_function(ai_polynomial);
                ai_polynomial_coefficients[i] += dx; // adjust the coefficient by a small amount
                let error_after = error_function(ai_polynomial);
                let error_slope = (error_after - error_before) / dx; // calculate the slope

                // Clip the gradient to prevent it from blowing up
                error_slope = constrain(error_slope, -max_gradient, max_gradient);

                tweaks.push({ error: error_slope * learning_rate, index: i }); // adjust the coefficient back
            }
        }

        // Apply all but the worst tweak
        tweaks.sort((a, b) => abs(b.error) - abs(a.error)); // sort by absolute error
        for (let i = 0; i < tweaks.length - 1; i++) {
            let tweak = tweaks[i];
            ai_polynomial_coefficients[tweak.index] -= tweak.error; // apply the best tweaks
        }
    }
}

function display_coefficients() {
    push();
    fill(255);
    noStroke();
    text(
        "AI Coefficients: " + ai_polynomial_coefficients.map(c => c.toFixed(4)).join(", "),
        10,
        height - 10
    );
    text(
        "Actual Coefficients: " + polynomial_data_coefficients.map(c => c.toFixed(4)).join(", "),
        10,
        height - 30
    );
    pop();
}

function show_ai_error() {
    push();
    fill(255);
    noStroke();
    text("AI Error: " + error_function(ai_polynomial).toFixed(2), 10, 40);
    pop();
}

function ai_polynomial(x) {
    let y = 0;
    for (let i = 0; i < ai_polynomial_coefficients.length; i++) {
        y += ai_polynomial_coefficients[i] * pow(x, i);
    }
    return y;
}

function show_actual_error() {
    push();
    fill(255);
    noStroke();
    text("Error Goal: " + error_function(actual_polynomial).toFixed(2), 10, 20);
    pop();
}

function error_function(f) {
    let error = 0;
    for (let i = 0; i < randomized_data.length; i++) {
        let x = randomized_data[i].x;
        let y = randomized_data[i].y;
        let predictedY = f(x);
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

    // Draw the AI polynomial line in red
    stroke(255, 0, 0);
    strokeWeight(2);
    noFill();
    beginShape();
    for (let px = x; px <= x + w; px++) {
        let graphX = map(px, x, x + w, minX, maxX);
        let graphY = ai_polynomial(graphX);
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

function randomize_polynomial_data_coefficients(length) {
    polynomial_data_coefficients = [];
    for (let i = 0; i < length; i++) {
        // Use a wider range and randomGaussian for more variation
        let coefficient = randomGaussian(0, (length - i) * 3); // Mean 0, standard deviation based on index
        polynomial_data_coefficients[i] = coefficient;
    }
}

function actual_polynomial(x) {
    let y = 0;
    for (let i = 0; i < polynomial_data_coefficients.length; i++) {
        y += polynomial_data_coefficients[i] * pow(x, i);
    }
    return y;
}

function generate_data(length, range) {
    randomized_data = [];
    for (let i = 0; i < length; i++) {
        let x = map(i, 0, length, range * -1, range);
        let y = actual_polynomial(x) + randomGaussian(0, 30);
        randomized_data.push({ x: x, y: y });
    }
}

function generate_sin_data(length, range) {
    randomized_data = [];
    for (let i = 0; i < length; i++) {
        let x = map(i, 0, length, range * -1, range);
        let y = (sin(x / 2) * 1000) + randomGaussian(0, 0.5);
        randomized_data.push({ x: x, y: y });
    }

    ai_polynomial_coefficients.forEach((c) => { c = 0; }); // reset AI coefficients
}

function mousePressed() {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        randomize_polynomial_data_coefficients(polynomial_length);
        generate_data(data_length, data_range);

        console.log("Coefficients:", polynomial_data_coefficients);
        console.log("Generated Data:", randomized_data);
    }
}

function keyPressed() {
    // press s to generate sin data (doesn't work yet)
    if (key === 's' && false) {
        generate_sin_data(data_length, 10);
        console.log("Generated Sin Data:", randomized_data);
    }
}

