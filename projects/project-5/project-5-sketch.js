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

    let b = new bound(50, 50, 300, 300)
    b_n = new bound(400, 50, 300, 300);
    pong = new pongSimulation(b);

    net = new NeuralNetwork([11, 8, 4, 2, 1]);
}


function draw() {
    background(0);

    pong.move_right_paddle(pong.ball_pos.y - pong.paddle_height / 2)
    pong.move_left_paddle(mouseY - pong.bound.y - pong.paddle_height / 2);
    
    pong.clamp_paddles();
    pong.show();
    pong.update();

    net.forward_propagate(pong.return_state());
    net.show(b_n);
}