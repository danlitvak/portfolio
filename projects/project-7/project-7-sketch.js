let xmin = -2.5;
let xmax = 1.5;
let ymin = -1.5;
let ymax = 1.5;
let maxIter = 1000;

let canvasSize;
let canvas;

let zoomStack = [];

let showHUD = true;

// integration starts here
// variables to keep track
let canvasHeight = 400;
let canvasWidth = 400;
let darkMode = document.body.classList.contains("dark-mode");
let currentBackground = 0;

function windowResized() {
  container = document.getElementById("canvas-container");
  canvasWidth = container.getBoundingClientRect().width;
  canvasHeight = canvasWidth * 0.8; // 4:3 aspect ratio
  resizeCanvas(canvasWidth, canvasHeight);
  adjustAspectRatio();
  redraw();
}

function setup() {
  // start up
  container = document.getElementById("canvas-container");
  const canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent(container);
  windowResized();
  // integration ends here

  pixelDensity(1);
  noLoop();
  adjustAspectRatio();
}

function adjustAspectRatio() {
  let complexWidth = xmax - xmin;
  let aspect = height / width;
  let complexHeight = complexWidth * aspect;

  let ymid = (ymin + ymax) / 2;
  ymin = ymid - complexHeight / 2;
  ymax = ymid + complexHeight / 2;
}

function draw() {
  let startTime = millis(); // Start timer

  loadPixels();
  colorMode(HSB);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let a = map(x, 0, width, xmin, xmax);
      let b = map(y, 0, height, ymin, ymax);

      let ca = a;
      let cb = b;
      let n = 0;

      while (n < maxIter) {
        let aa = a * a - b * b;
        let bb = 2 * a * b;
        a = aa + ca;
        b = bb + cb;
        if (abs(a + b) > 32) break;
        n++;
      }

      let norm = n / maxIter;
      let sqhu = pow(norm, 0.5);
      let hu = map(sqhu, 0, 1, 0, 255);
      let col = color(hu, 255, n === maxIter ? 0 : 255);

      let pix = 4 * (x + y * width);
      pixels[pix + 0] = red(col);
      pixels[pix + 1] = green(col);
      pixels[pix + 2] = blue(col);
      pixels[pix + 3] = 255;
    }
  }

  colorMode(RGB);
  updatePixels();

  drawHUD();


  let elapsed = millis() - startTime;
  console.log(`Draw time: ${elapsed.toFixed(2)} ms`);
}

function mousePressed() {
  if (mouseButton !== LEFT) return; // Only zoom on left click

  // Push current view to stack before zoom
  zoomStack.push({
    xmin: xmin,
    xmax: xmax,
    ymin: ymin,
    ymax: ymax
  });

  let cx = map(mouseX, 0, width, xmin, xmax);
  let cy = map(mouseY, 0, height, ymin, ymax);

  let zoomFactor = 0.5;
  let currentWidth = xmax - xmin;
  let currentHeight = ymax - ymin;

  let newWidth = currentWidth * zoomFactor;
  let newHeight = currentHeight * zoomFactor;

  xmin = cx - newWidth / 2;
  xmax = cx + newWidth / 2;
  ymin = cy - newHeight / 2;
  ymax = cy + newHeight / 2;

  adjustAspectRatio();
  redraw();
}

function drawHUD() {
  if (!showHUD) return;

  let centerX = (xmin + xmax) / 2;
  let centerY = (ymin + ymax) / 2;
  let zoomLevel = 4 / (xmax - xmin); // Since original view is width 4

  noStroke();
  fill(0, 150); // semi-transparent black background
  rect(0, height - 50, 165, 50);

  fill(255); // white text
  textSize(12);
  textAlign(LEFT, TOP);
  text(`Center: (${centerX.toFixed(5)}, ${centerY.toFixed(5)})`, 5, height - 45);
  text(`Zoom: ${zoomLevel.toFixed(2)}x`, 5, height - 30);
  text(`Max Iter: ${maxIter}`, 5, height - 15);
}


function keyPressed() {
  if (key === 'z' || key === 'Z') {
    if (zoomStack.length > 0) {
      let previous = zoomStack.pop();
      xmin = previous.xmin;
      xmax = previous.xmax;
      ymin = previous.ymin;
      ymax = previous.ymax;

      adjustAspectRatio();
      redraw();
    } else {
      console.log("Nothing to undo!");
      console.log("Draw time: 0.00 ms");
    }
  }

  if (key === ' ') {
    showHUD = !showHUD;
    redraw();
    return false;
  }
}
