// integration starts here
// variables to keep track
let canvasHeight = 400;
let canvasWidth = 400;

// function for resizing
function windowResized() {
    container = document.getElementById('canvas-container');
    canvasWidth = container.getBoundingClientRect().width;
    canvasHeight = canvasWidth; // square canvas
    resizeCanvas(canvasWidth, canvasHeight); // run resizeCanvas
}

let pongs;
let w, h, margin; // width and height of the individual pong simulation

let statistic_fitness_deviation = 0; // percent deviation of the fitness
let statistic_average_score = 0; // average score

let current_generation = 0; // current generation
let simulation_speed = 10; // speed of the simulation

function setup() {
    // start up
    container = document.getElementById('canvas-container');
    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    windowResized();
    // integration ends here

    textAlign(CENTER, CENTER);

    pongs = []; // array of pong simulations
    margin = 10; // margin between the pong simulations and edge
    w = ((width - margin) / 5) - margin; // width of individual pong
    h = ((height - margin) / 5) - margin; // height of individual pong
    for(let i = 0; i < 20; i++) {
        let b = new bound((w + margin) * (i % 4) + margin, (h + margin) * (floor(i / 4)) + margin, w, h); // pong bound
        let b_n = new bound(b.x + b.w / 8, b.y + b.h / 2, 6 * b.w / 8, b.h / 2); // place neural net in the middle of the pong
        // create a new pong simulation with the neural network (debug = true)
        pongs.push(new pongSimulation(b, new NeuralNetwork([11, 16, 8, 4, 1], b_n), false, i)); 
    }
}


function draw() {
    background(0);

    // update and draw the pong simulations
    for (let i = 0; i < simulation_speed; i++) {
        let sims_done = true;
        pongs.forEach((pong) => {
            push();
            pong.update(100); // main update loop, update the pong simulation and neural network, untill a score of 100 is reached
            if(abs(pong.left_score - pong.right_score) < 100) {
                sims_done = false; // if any pong simulation is not done, set sims_done to false
            }
            pong.show(); // show the pong simulation and neural network
            pop();
        });

        // if all pong simulations are done, create a new generation
        if(sims_done) {
            new_generation_ELITE(); // create a new generation with elitism
            console.log("New generation created, generation: " + current_generation); // log the new generation
        }
    }

    highlight_best_game(); // highlight the best pong simulation
    information_display(); // show the information display

    // update statistics
    if(frameCount % 120 == 0) {
        calculate_fitness_deviation(); // calculate the percent deviation of the fitness
        calculate_average_score(); // calculate the average score
        console.log("Generation: " + current_generation + " | Average Score: " + statistic_average_score.toFixed(2) + " pts"); // log the average score
        sort_pongs(); // sort the pongs by fitness and log
    }
}

function information_display() {
    // information display
    push();
    let travel = 0;
    noFill();
    stroke(255);
    strokeWeight(2);
    translate((w + margin) * 4 + margin, margin); // top left of the information display
    rect(0, 0, w, (h + margin) * 5 - margin); // outline the information display

    noStroke();
    fill(255);
    text("Dashboard", 0, travel, w, 20); // title
    stroke(255);
    line(0, 20, w, 20); // line under title
    noStroke();
    textSize(10);
    textAlign(LEFT, CENTER);
    
    // instructions
    travel += 20;
    text(" --- Key Controls ---", 5, travel, w, 20); 
    travel += 10;
    text("SPACE: debug", 5, travel, w, 20); 
    travel += 10;
    text("R: Hard Reset All", 5, travel, w, 20);
    travel += 10;
    text("S: Sort (Red = #1)", 5, travel, w, 20);
    travel += 10;
    text("G: Create New Generation", 5, travel, w, 20);
    travel += 10;
    text("UP: Increase Speed", 5, travel, w, 20);
    travel += 10;
    text("DOWN: Decrease Speed", 5, travel, w, 20);

    // statistics
    travel += 15;
    text(" --- Statistics ---", 5, travel, w, 20); 
    travel += 10;
    text("Fitness Deviation: " + statistic_fitness_deviation.toFixed(2) + "%", 5, travel, w, 20); // percent deviation
    travel += 10;
    text("Average Score: " + round(statistic_average_score) + " pts", 5, travel, w, 20); // percent deviation
    travel += 10;
    text("Current Generation: " + current_generation, 5, travel, w, 20); // current generation
    travel += 10;
    text("Simulation Speed: " + simulation_speed, 5, travel, w, 20); // current generation
    travel += 10;
    text("Best ID: " + pongs[0].id, 5, travel, w, 20); // best pong id
    travel += 10;
    text("Best Fitness: " + pongs[0].total_fitness.toFixed(0), 5, travel, w, 20); // best pong fitness
    pop();
}

function calculate_fitness_deviation() {
    // calculate the percent deviation of the fitness
    let sum = 0;
    let avg = 0;
    let n = pongs.length;

    pongs.forEach((pong) => {
        sum += pong.total_fitness; // sum of fitness
    });

    avg = sum / n; // average fitness

    let deviation = 0;
    pongs.forEach((pong) => {
        deviation += abs(pong.total_fitness - avg); // absolute deviation from average
    });

    statistic_fitness_deviation = abs((deviation / n) / avg) * 100; // percent deviation
}

function calculate_average_score() {
    // calculate the average score
    let sum = 0;
    let n = pongs.length;

    pongs.forEach((pong) => {
        sum += pong.left_score - pong.right_score; // sum of scores
    });

    statistic_average_score = sum / n; // average fitness
}

function highlight_best_game() {
    pongs.forEach((pong, i) => {
        push();
        stroke(255);
        strokeWeight(2);
        fill(0, 255, 0, map(pongs.length - i, 0, pongs.length, -128, 128));
        rect(pong.bound.x, pong.bound.y, pong.bound.w, pong.bound.h); // outline the pong simulation
        pop();
    });
}

function sort_pongs() {
    // sort the pongs by fitness
    pongs.sort((a, b) => {
        return b.total_fitness - a.total_fitness; // sort by fitness
    });

    console.log("");
    for(let i = 0; i < 5; i++) {
        console.log("Rank: " + i + " | Pong ID " + pongs[i].id + ": " + pongs[i].total_fitness); // log the fitness
    }
    console.log(" ... ");

    // console.log("Sorted by fitness, best: ", pongs[0].total_fitness); // log the best fitness
}

// create new generation where the top k pongs are selected to reproduce (elitism)
function new_generation_ELITE() {
    sort_pongs(); // sort the pongs by fitness
    let length = pongs.length; // length of the pongs array
    let k = floor(length / 4); // number of pongs to select for reproduction

    for(let i = 0; i < length; i++) {
        if(i == 0) {
            // best pong is saved
        } else if (i < k){
            // elite pongs are slightly mutated
            pongs[i].net.mutate(0.1); // mutate the neural network
        } else {
            pongs[i].net.set_from_crossover(pongs[floor(random(k))].net, pongs[floor(random(k))].net); // crossover the neural networks
        }

        pongs[i].soft_reset(); // soft reset the pong simulation
    }

    current_generation++;
}

// create new generation where mutation is proportional to fitness (proportional mutation)
function new_generation_MPROP() {
    sort_pongs(); // sort the pongs by fitness
    let length = pongs.length; // length of the pongs array
    pongs.forEach((pong, i) => {
        pong.net.mutate(map(i, 0, length, 0, 1)); // mutate the neural network
        pong.soft_reset(); // soft reset the pong simulation
    });

    current_generation++;
}

// handle keyboard input
function keyPressed() {
    // check if the mouse is within the bounds before checking for key presses
    if(mouseX > 0 && mouseX < height && mouseY > 0 && mouseY < width) {
        // toggle debug mode for all pongs
        if (keyCode == 32) {
            pongs.forEach((pong, i) => {
                pong.debug = !pong.debug; // toggle debug mode
            });
        }

        // hard reset all pongs
        if (keyCode == 82) { 
            pongs.forEach((pong, i) => {
                pong.hard_reset(); // reset the pong simulation
            });
        }

        // S: sort the pongs by fitness
        if (keyCode == 83) {
            sort_pongs(); // sort the pongs by fitness
        }

        // manually begin new generation
        if (keyCode == 71) {
            new_generation_ELITE(); // create a new generation
        }

        // arrow keys to change simulation speed
        if (keyCode == UP_ARROW) {
            simulation_speed = constrain(simulation_speed + 1, 1, 30); // increase simulation speed
        } else if (keyCode == DOWN_ARROW) {
            simulation_speed = constrain(simulation_speed - 1, 1, 30); // decrease simulation speed
        }

        return false;
    }
}