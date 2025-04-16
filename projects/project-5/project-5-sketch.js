// integration starts here
// variables to keep track
let canvasHeight = 400;
let canvasWidth = 400;

// function for resizing
function windowResized() {
    container = document.getElementById('canvas-container');
    canvasWidth = container.getBoundingClientRect().width;
    canvasHeight = canvasWidth;

    resizeCanvas(canvasWidth, canvasHeight);
}

let pong;
let net;
let b_n;


function setup() {
    // start up
    container = document.getElementById('canvas-container');
    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    windowResized();
    // integration ends here

    textAlign(CENTER, CENTER);

    let b = new bound(50, 50, 300, 300); // pong bound
    b_n = new bound(b.x + b.w / 8, b.y + b.h / 2, 6 * b.w / 8, b.h / 2); // place neural net in the middle of the pong
    pong = new pongSimulation(b);
    net = new NeuralNetwork([11, 8, 4, 2, 1], b_n);
}


function draw() {
    background(0);

    net.forward_propagate(pong.return_state()); // propagate the neural network with the pong state
    output = net.output(); // get the output of the neural network

    accuracy = pong.calculate_left_paddle_score(); // calculate the score of the left paddle

    if(frameCount % 10 == 0) {
        console.log("Frame: " + frameCount + ", Accuracy: " + (accuracy * 100).toFixed(2) + "%" + ", Fitness: " + pong.total_fitness); // get the score of the left paddle
    }

    pong.move_left_paddle(output * (pong.bound.h - pong.paddle_height)); // move left paddle to network output
    // pong.move_left_paddle(mouseY - pong.bound.y - pong.paddle_height / 2); // move left paddle (mouse position)
    pong.move_right_paddle(pong.ball_pos.y - pong.paddle_height / 2) // move right paddle to ball position (perfect play)

    pong.clamp_paddles(); // clamp paddles to withen the bounds
    pong.update(); // update the pong simulation after clamping the paddles
    if(pong.debug == true) {
        net.show(); // show the neural network
    }
    pong.show(); // show the pong simulation

}

// handle keyboard input
function keyPressed() {
    // check if the mouse is within the bounds before checking for key presses
    if(mouseX > 0 && mouseX < height && mouseY > 0 && mouseY < width) {
        if (keyCode === 32) { // space bar
            pong.debug = !pong.debug; // toggle debug mode
        }

        return false;
    }
}