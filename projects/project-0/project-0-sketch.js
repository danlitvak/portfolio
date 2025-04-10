let cols, rows;
let s = 0.5;
let w = 50;
let h = 50;

function setup() {
    createCanvas(600, 600, WEBGL);
    orbitControl();
    cols = w / s;
    rows = h / s;
    background(0);
}

function surfaceFunction(x, z) {
    let r = sqrt(x * x + z * z);
    return r == 0 ? -1 : -sin(r) / r;
}

function draw() {
    background(0);
    orbitControl();
    scale(5)
    directionalLight(255, 255, 255, -1, -1, -1);
    directionalLight(128, 128, 128, 1, 1, 1);
    ambientLight(50);
    fill(100);

    noStroke()

    for (let z = 0; z < rows - 1; z++) {
        beginShape(TRIANGLE_STRIP);
        for (let x = 0; x < cols; x++) {
            let xPos = (x - cols / 2) * s;
            let zPos = (z - rows / 2) * s;

            let y1 = surfaceFunction(xPos, zPos) * 30;
            let y2 = surfaceFunction(xPos, (zPos + s)) * 30;

            let nx = xPos / sqrt(xPos * xPos + zPos * zPos + 1);
            let ny = 1;
            let nz = zPos / sqrt(xPos * xPos + zPos * zPos + 1);
            normal(nx, ny, nz);
            vertex(xPos, y1, zPos);
            normal(nx, ny, nz);
            vertex(xPos, y2, zPos + s);
        }
        endShape();
    }
}