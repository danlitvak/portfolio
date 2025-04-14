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

function setup() {
    // start up
    container = document.getElementById('canvas-container');
    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    windowResized();
    // integration ends here

    pong = new pongSimulation(new bound(50, 50, 300, 300));
    textAlign(CENTER, CENTER);
}


function draw() {
    background(0);
    pong.left_paddle_pos = pong.ball_pos.y - pong.paddle_height / 2;
    pong.right_paddle_pos = mouseY - pong.bound.y - pong.paddle_height / 2;
    pong.clamp_paddles();
    pong.show();
    pong.update();
}