let minzoom = 1;
let maxzoom = 1000;

let canvas_pos_x = 0;
let canvas_pos_y = 0;
let canvas_zoom_x = 300;
let canvas_zoom_y = 300;

let zoom_mode = "none";

let data_length = 300; // amount of data points to generate
let data_range = 5; // half of the range

let data = [];
let degree = 6;

let data_coefficients = [];
let data_error = 0;

let ai_coefficients = [];
let ai_error = 0;

let speed = 10;

let itterations = 0;

// integration starts here
// variables to keep track
let canvasHeight = 400;
let canvasWidth = 400;
let darkMode = document.body.classList.contains("dark-mode");
let currentBackground = 0;

function windowResized() {
    container = document.getElementById("canvas-container");
    canvasWidth = container.getBoundingClientRect().width;
    canvasHeight = canvasWidth * 0.6;
    resizeCanvas(canvasWidth, canvasHeight);
}

function setup() {
    // start up
    container = document.getElementById("canvas-container");
    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    windowResized();
    // integration ends here

    noCursor();
    textFont("Courier New");
    ai_coefficients = randomize_coefficients(degree);
    data_coefficients = randomize_coefficients(degree);
    data = init_data(data_coefficients, data_length, data_range);
    data_error = error_function(data, data_coefficients);
}

function draw_background() {
    darkMode = document.body.classList.contains("dark-mode");
    if (darkMode) {
        currentBackground = lerp(currentBackground, 0, 0.1);
    } else {
        currentBackground = lerp(currentBackground, 200, 0.1);
    }
    background(currentBackground);
}

function handle_mouse_logic() {
    if (mouseIsPressed) {
        if (keyCode == 16 && keyIsPressed) {
            let dy = pmouseY - mouseY;
            if (mouseY > height / 2 + canvas_pos_y) {
                // inverse
                dy *= -1;
            }
            if (dy > 0) {
                canvas_zoom_y *= 1 + abs(dy / 100);
            } else {
                canvas_zoom_y /= 1 + abs(dy / 100);
            }
            canvas_zoom_y = min(max(canvas_zoom_y, minzoom), maxzoom);
        } else if (keyCode == 17 && keyIsPressed) {
            let dx = (pmouseX - mouseX) * -1;
            if (mouseX > width / 2 + canvas_pos_x) {
                // inverse
                dx *= -1;
            }
            if (dx < 0) {
                canvas_zoom_x *= 1 + abs(dx / 100);
            } else {
                canvas_zoom_x /= 1 + abs(dx / 100);
            }
            canvas_zoom_x = min(max(canvas_zoom_x, minzoom), maxzoom);
        } else {
            canvas_pos_x -= (pmouseX - mouseX) * 1;
            canvas_pos_y -= (pmouseY - mouseY) * 1;
        }
    }

    if (keyIsPressed) {
        if (keyCode == 16) {
            zoom_mode = "vert";
        } else if (keyCode == 17) {
            zoom_mode = "hori";
        }
    } else {
        zoom_mode = "none";
    }
}

function draw() {
    draw_background();
    handle_mouse_logic();

    translate(width / 2, height / 2);
    translate(canvas_pos_x, canvas_pos_y);

    // --- Draw Graphy Stuff ---
    // show axis and tics
    show_axis();
    show_tics();
    // show error lines between points and curve
    show_error_lines(ai_coefficients);
    // show polynomial of the curve fitter
    stroke(255, 0, 0);
    strokeWeight(2);
    show_polynomial(ai_coefficients);
    // show data
    show_data();
    // show crosshair with zoom indicaters
    show_crosshair();

    // --- Draw Information ---
    drawtext();

    // --- main loop: fit the curve ---
    let dx = 0.00001;
    let learning_rate = 0.1;
    let max_learning_rate = 1;

    for (let s = 0; s < speed; s++) {
        tweaks = [];
        // firstly find all the tweaks that go down the slope
        ai_error = error_function(data, ai_coefficients);
        for (let i = 0; i < ai_coefficients.length; i++) {
            let error_before = error_function(data, ai_coefficients);
            ai_coefficients[i] += dx;
            let error_after = error_function(data, ai_coefficients);
            let slope = (error_after - error_before) / dx;

            slope = constrain(slope, -max_learning_rate, max_learning_rate);

            tweaks.push({ error: slope * learning_rate, index: i });
        }

        // then selectivly apply the best tweaks
        tweaks.sort((a, b) => abs(b.error) - abs(a.error)); // sort by absolute error
        for (let i = 0; i < tweaks.length - 1; i++) {
            let tweak = tweaks[i];
            ai_coefficients[tweak.index] -= tweak.error; // apply the best tweaks
        }

        itterations++;
    }
}

function show_error_lines(coefficients) {
    push();
    strokeWeight(2);
    data.forEach((data_point) => {
        let x0 = data_point.x;
        let y0 = data_point.y;
        let x1 = x0;
        let y1 = polynomial(coefficients, x1);

        error = pow(abs(y1 - y0), 2);

        stroke(map(error, 0, 0.05, 0, 255), map(error, 0.1, 0, 0, 255), map(error, 0.01, 0, 0, 255), 64);

        line(get_x(x0), get_y(y0), get_x(x1), get_y(y1));
    });
    pop();
}

function error_function(data, coefficients) {
    let accumulated_error = 0;

    data.forEach((data_point) => {
        let x = data_point.x;
        let y = data_point.y;
        abs_error = abs(y - polynomial(coefficients, x));
        accumulated_error += pow(abs_error, 2);
    });

    accumulated_error /= data.length;

    return accumulated_error;
}

function show_crosshair() {
    push();
    resetMatrix();
    if (zoom_mode == "vert") {
        stroke(255, 0, 0);
    } else {
        stroke(255, 128);
    }

    line(mouseX, mouseY - 10, mouseX, mouseY + 10);

    if (zoom_mode == "hori") {
        stroke(0, 0, 255);
    } else {
        stroke(255, 128);
    }

    line(mouseX - 10, mouseY, mouseX + 10, mouseY);

    pop();
}

function show_tics() {
    push();
    let th = 5; // tic height;
    let spacing_x = 0.2;
    let spacing_y = 0.2;
    stroke(128, 128);

    // x-axis
    for (let i = spacing_x; get_x(i) < width - canvas_pos_x; i += spacing_x) {
        let x = get_x(i);
        line(x, -th, x, th);
    }

    for (let i = -spacing_x; get_x(i) > -width - canvas_pos_x; i -= spacing_x) {
        let x = get_x(i);
        line(x, -th, x, th);
    }

    // y-axis
    for (let i = spacing_y; get_y(i) < height - canvas_pos_y; i += spacing_y) {
        let y = get_y(i);
        line(-th, y, th, y);
    }
    for (let i = -spacing_y; get_y(i) > -height - canvas_pos_y; i -= spacing_y) {
        let y = get_y(i);
        line(-th, y, th, y);
    }

    pop();
}

function show_axis() {
    push();
    stroke(128, 128);
    // x-axis
    if (zoom_mode == "hori") {
        stroke(0, 0, 200, 128);
    } else {
        stroke(128, 128);
    }
    line(-width - canvas_pos_x, 0, width - canvas_pos_x, 0);
    // y-axis
    if (zoom_mode == "vert") {
        stroke(200, 0, 0, 128);
    } else {
        stroke(128, 128);
    }
    line(0, -height - canvas_pos_y, 0, height - canvas_pos_y);
    pop();
}

function show_polynomial(coefficients) {
    push();
    noFill();
    beginShape();
    let dx = (2 * 2) / data_length;
    for (let x = 2 * -1; x < 2; x += dx) {
        vertex(get_x(x), get_y(polynomial(coefficients, x)));
    }
    endShape();
    pop();
}

function show_data() {
    push();

    if (darkMode) {
        fill(255);
        noStroke();
    } else {
        fill(64);
        stroke(0, 128);
        strokeWeight(2);
    }

    data.forEach((p) => {
        let x = p.x;
        let y = p.y;
        circle(get_x(x), get_y(y), 2);
    });
    pop();
}

function get_x(x) {
    return x * canvas_zoom_x;
}

function get_y(y) {
    return y * canvas_zoom_y;
}

function randomize_coefficients(degree) {
    let coefficients = [];

    for (let n = 0; n < degree; n++) {
        coefficients.push(randomGaussian(0, degree - n));
    }

    return coefficients;
}

function init_data(coefficients, length, range) {
    gen_data = [];

    // generate clean data
    let max_y = -Infinity;
    let min_y = Infinity;
    for (let i = 0; i < length; i++) {
        let x = map(i, 0, length, -range, range); // map index to x
        let y = polynomial(coefficients, x); // y = f(x)
        if (y > max_y) {
            max_y = y;
        }
        if (y < min_y) {
            min_y = y;
        }
        gen_data.push({ x: x, y: y });
    }

    // shrink all values between 0-1 in both axis
    for (let i = 0; i < length; i++) {
        gen_data[i].x /= range;
        gen_data[i].y = map(gen_data[i].y, min_y, max_y, -1, 1);
    }

    // sprinkle in some randomness
    gen_data.forEach((data_point) => {
        // random x-shift with SD of 1%
        data_point.x += randomGaussian(0, range * 0.01);
        // random y-shift with SD of 1%
        data_point.y += randomGaussian(0, range * 0.01);
    });

    return gen_data;
}

function init_data_sin(length, range) {
    gen_data = [];

    // generate clean data
    for (let i = 0; i < length; i++) {
        let x = map(i, 0, length, -1, 1); // map index to x
        let y = sin(x * 4); // y = f(x)
        gen_data.push({ x: x, y: y });
    }

    // sprinkle in some randomness
    gen_data.forEach((data_point) => {
        data_point.x += randomGaussian(0, range * 0.005);
        data_point.y += randomGaussian(0, range * 0.005);
    });

    return gen_data;
}

function factorial(n) {
    if (n < 0) return undefined; // Factorial is undefined for negative numbers
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function polynomial(coefficients, x) {
    let y = 0;
    for (let n = 0; n < coefficients.length; n++) {
        y += coefficients[n] * pow(x, n);
    }
    return y;
}

function mouseWheel(event) {
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        return true; // ignore mouse wheel events outside the canvas
    }

    ratio = canvas_zoom_x / canvas_zoom_y;

    if (event.delta < 0) {
        canvas_zoom_x *= 1.1;
        canvas_zoom_y *= 1.1;

        canvas_pos_x *= 1.1;
        canvas_pos_y *= 1.1;
    } else {
        canvas_zoom_x /= 1.1;
        canvas_zoom_y /= 1.1;

        canvas_pos_x /= 1.1;
        canvas_pos_y /= 1.1;
    }

    canvas_zoom_x = min(max(canvas_zoom_x, minzoom), maxzoom);
    canvas_zoom_y = min(max(canvas_zoom_y, minzoom), maxzoom);

    canvas_zoom_x = canvas_zoom_y * ratio;

    return false; // prevent default scrolling behavior while inside the canvas
}

function drawtext() {
    push();
    resetMatrix();
    fill(255);
    stroke(0, 128);
    strokeWeight(3);
    textSize(13);

    let ride; // keep track of text position

    // top left of the screen (fit information)
    textAlign(LEFT, TOP);
    ride = 0;
    // text("Error Goal: " + data_error.toFixed(2), 0, ride);
    // ride += 12;
    push();
    fill(0, 255, 0);
    text("Current Error  : " + ai_error.toFixed(5), 0, ride);
    pop();

    // ride += 12;
    // text(
    //   "Real Polynomial: " + data_coefficients.map((c) => c.toFixed(4)).join(", "),
    //   0,
    //   ride
    // );
    ride += 12;
    text("iterations     : " + itterations, 0, ride);
    ride += 12;
    text("Fit Polynomial : " + ai_coefficients.map((c) => c.toFixed(4)).join(", "), 0, ride);
    ride += 12;

    // top right of the screen (performance information)
    textAlign(RIGHT, TOP);
    text("FPS: " + frameRate().toFixed(2), width, 0); // add 12 each time

    // bottom left of the screen (canvas information)
    textAlign(LEFT, BOTTOM);
    ride = 0;
    // text("S: Sinusoidal Fit", 0, height - ride);
    // ride += 12;
    // text("SPACE: New Fit", 0, height - ride);
    // ride += 12;
    text("Zoom Y: " + canvas_zoom_y.toFixed(2), 0, height - ride);
    ride += 12;
    text("Zoom X: " + canvas_zoom_x.toFixed(2), 0, height - ride);
    ride += 12;
    text("Position Y: " + canvas_pos_y.toFixed(2), 0, height - ride);
    ride += 12;
    text("Position X: " + canvas_pos_x.toFixed(2), 0, height - ride);
    ride += 12;

    textAlign(RIGHT, BOTTOM);
    textSize(10);
    text("version 1.0 @ 05.01.25", width, height);

    pop();
}

function keyPressed() {
    if (keyCode == 32) {
        // new fit
        // ai_coefficients = randomize_coefficients(degree);
        // dont randomize coefficients, just use the same ones as before to see smoother transitions
        data_coefficients = randomize_coefficients(degree);
        data = init_data(data_coefficients, data_length, data_range);
        data_error = error_function(data, data_coefficients);

        itterations = 0;

        return false; // prevent default scrolling behavior while inside the canvas
    }

    if (keyCode == 83) {
        // ai_coefficients = randomize_coefficients(degree);
        data = init_data_sin(data_length, data_range);
        data_error = error_function(data, data_coefficients);
    }
}
