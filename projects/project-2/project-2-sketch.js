const G = 6.67 / 10;
let timeScale = 1;
let predictionLength = 1000;
let s = 0.1;
let total_ek = 0;
let center;
let midvector;
let dragging = false;

// integration starts here
// variables to keep track
let canvasHeight = 400;
let canvasWidth = 400;

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

    timescale = max(timeScale, 1);
    textAlign(LEFT, TOP);

    sun = new gravityObject(
        true,
        500000,
        30,
        createVector(0, 0),
        createVector(0, 0),
        createVector(0, 0)
    );

    earth = new gravityObject(
        true,
        5000,
        15,
        createVector(1500, 0),
        createVector(0, 15),
        createVector(0, 0)
    );

    system = new gravitySystemHandler([sun, earth]);

    // prediction system
    psystem = new gravitySystemHandler();

    // set center of the screen
    m = createVector(width / 2, height / 2);
}

function draw() {
    for (let i = 0; i < timeScale; i++) {
        system.updateSystem();
    }

    background(10);
    translate(m);
    // translate(system.objects[0].position.copy().mult(-1 * s).add(m));
    // print(system.objects[1].position.x)
    scale(s);

    // ---- predict future movement of objects ----
    predictanddraw();

    system.drawField_3();
    system.drawSystem();

    if (!mouseIsPressed) {
        // pretect user from placing an object by dragging
        dragging = false;
    }

    drawtext();

    // calculate total kinetic energy and center of objects
    // ------
    // total_ek = 0;
    // center = createVector(0, 0);
    // system.objects.forEach((obj) => {
    //   total_ek += obj.velocity.magSq() * obj.mass *0.5;
    //   center.add(obj.position);
    // });
    // center.div(system.objects.length);

    // show center of mass
    // ------
    // push();
    // noStroke();
    // fill(0, 0, 255);
    // circle(center.x, center.y, 5/s);
    // pop();

    // show total kinetic energy
    // ------
    // push();
    // noStroke();
    // fill(255);
    // textSize(15 / s);
    // text(
    //   "Total Kinetic Energy: " + round(total_ek * 100) / 100,
    //   -width / 2 / s + 10,
    //   -height / 2 / s + 10
    // );
    // pop();
}

function drawtext() {
    push();
    resetMatrix();
    fill(255, 200);
    stroke(0, 200);
    strokeWeight(2);
    textSize(15);

    textAlign(LEFT, TOP);
    text("FPS: " + frameRate(), 0, 0);

    textAlign(RIGHT, TOP);

    textAlign(LEFT, BOTTOM);
    text("Mouse Click: Insert New Gravity Object", 0, height);
    text("R: Randomize Objects", 0, height - 12);

    textAlign(RIGHT, BOTTOM);
    textSize(10);
    text("version 1.0 @ 12.01.24", width, height);

    pop();
}

function predictanddraw() {
    psystem.objects = []; // reset gravity objects

    // create new copies objects
    for (let i = 0; i < system.objects.length; i++) {
        let ipos = system.objects[i].position.copy();
        let ivel = system.objects[i].velocity.copy();
        let iacc = system.objects[i].acceleration.copy();

        psystem.objects.push(
            new gravityObject(
                system.objects[i].isMoving,
                system.objects[i].mass,
                system.objects[i].radius,
                ipos,
                ivel,
                iacc
            )
        );
    }

    // simulate and record positions
    for (let n = 0; n < predictionLength; n++) {
        for (let i = 0; i < system.objects.length; i++) {
            system.objects[i].future[n] = psystem.objects[i].position.copy();
        }

        psystem.updateSystem();
    }

    push();
    // draw future positions as lines
    for (let n = 0; n < system.objects.length; n++) {
        // for each object n:
        for (let i = 0; i < system.objects[n].future.length - 1; i++) {
            stroke(0, 0, 255, map(i, 0, predictionLength, 100, 0));
            strokeWeight(map(i, 0, predictionLength, 5, 0) / s);

            line(
                system.objects[n].future[i].x,
                system.objects[n].future[i].y,
                system.objects[n].future[i + 1].x,
                system.objects[n].future[i + 1].y
            );
        }
    }
    pop();

}

function mouseDragged() {
    dragging = true;
    m.x -= pmouseX - mouseX;
    m.y -= pmouseY - mouseY;
}

function keyPressed() {

    if (keyCode == 82) {
        system.objects.forEach((object) => {
            object.position = createVector((random(-width, width) / 4) / s, (random(-height, height) / 4) / s);
            object.velocity.div(5);
            object.acceleration.mult(0);
        });
    }

    return false;
}

function mouseClicked() {
    if (dragging) { return }

    system.objects.push(
        new gravityObject(
            random([true]),
            random(10, 100000),
            random(10, 50),
            createVector((mouseX - width / 2) / s, (mouseY - height / 2) / s),
            p5.Vector.random2D().mult(10),
            createVector(0, 0)
        )
    );
}

class gravitySystemHandler {
    constructor(objects) {
        this.objects = objects;
        this.nullObject = new gravityObject(
            true,
            1,
            1,
            createVector(0, 0),
            createVector(0, 0),
            createVector(0, 0)
        );
    }

    updateSystem() {
        this.updatePositions();

        for (let i = 0; i < this.objects.length; i++) {
            let netForce = new p5.Vector(0, 0);

            for (let j = 0; j < this.objects.length; j++) {
                if (i != j) {
                    let force = this.calculateForce(this.objects[j], this.objects[i]);
                    netForce.add(force);

                    if (this.objects[i].isMoving == false) {
                        this.objects[j].addForce(force.mult(-1));
                    }
                }
            }

            this.objects[i].addForce(netForce);
        }
    }

    calculateForce(object1, object2) {
        // numerator:
        let numerator = G * object1.mass * object2.mass;

        // denominator:

        // distance between both objects
        let radius = p5.Vector.sub(object1.position, object2.position);

        //set lower bound of radius
        radius.setMag(max(object1.radius + object2.radius, radius.mag()));

        radius.setMag(1 / radius.magSq()); // inverse square the vector

        // print(p5.Vector.mult(radius, numerator));
        return p5.Vector.mult(radius, numerator);
    }

    updatePositions() {
        this.objects.forEach((object) => {
            object.updatePosition();
        });
    }

    drawSystem() {
        this.objects.forEach((object) => {
            object.drawObject();
        });
    }

    calculateField(x, y) {
        let sum = createVector(0, 0);

        this.objects.forEach((object) => {
            this.nullObject.position.x = x;
            this.nullObject.position.y = y;

            sum.add(this.calculateForce(this.nullObject, object));
        });

        return sum.mult(-1);
    }

    drawField_1() {
        push();
        let detail = 6;
        noStroke();
        fill(255);

        for (let y = (-1 * height) / 2; y < height / 2; y += detail) {
            for (let x = (-1 * width) / 2; x < width / 2; x += detail) {
                let offset = this.calculateField(x + 5, y + 5).mult(10);
                let m = min(offset.mag() * 15, 255);

                fill(255, 255 - m, 255 - m);
                circle(
                    x + offset.x + detail / 2,
                    y + offset.y + detail / 2,
                    detail - 2
                );
            }
        }

        pop();
    }

    drawField_2() {
        push();
        stroke(255);

        let detail = 100;

        for (let t = 0; t < detail; t++) {
            let theta = t * (TWO_PI / detail);

            let x = max(width, height) * cos(theta);
            let y = max(width, height) * sin(theta);

            for (let n = 0; n < detail; n++) {
                let df = this.calculateField(x, y).setMag(5 / s);

                line(x, y, x + df.x, y + df.y);

                x += df.x;
                y += df.y;
            }
        }

        pop();
    }

    drawField_3() {
        push();
        let detail = 15;
        fill(255);

        for (let y = (-1 * height) / 2 / s; y < height / 2 / s; y += detail / s) {
            for (let x = (-1 * width) / 2 / s; x < width / 2 / s; x += detail / s) {
                let offset = this.calculateField(x, y).mult(500);

                strokeWeight(1 / s);
                let m = offset.mag();

                stroke(255);

                if (m > sqrt(2) * detail / s / 2) {
                    stroke(
                        255,
                        255 - (m - (sqrt(2) * detail / s / 2)),
                        255 - (m - (sqrt(2) * detail / s / 2))
                    );
                }

                if (m < 0.5) {
                    noStroke();
                } else {
                    offset.limit(sqrt(2) * detail / s / 2);
                    line(x, y, x + offset.x, y + offset.y);
                }

            }
        }

        pop();
    }
}

class gravityObject {
    constructor(isMoving, mass, Radius, iPos, iVel, iAcc) {
        this.isMoving = isMoving;
        this.mass = mass;
        this.radius = Radius;
        this.position = iPos;
        this.velocity = iVel;
        this.acceleration = iAcc;

        this.future = []; // each gravity object has an array to store predicted positions
    }

    updatePosition() {
        if (this.isMoving) {
            let newvel = p5.Vector.add(this.velocity, this.acceleration);
            this.velocity.lerp(newvel, 1 / timeScale);
            let newpos = p5.Vector.add(this.position, this.velocity);
            this.position.lerp(newpos, 1 / timeScale);
        }
        this.acceleration.setMag(0);
    }

    addForce(force) {
        this.acceleration.add(force.div(this.mass)); // acc = Force/mass
    }

    drawObject() {
        push();
        translate(this.position);
        if (this.isMoving) {
            fill(255);
            noStroke();
        } else {
            fill(0);
            stroke(255);
            strokeWeight(1 / s);
        }
        circle(0, 0, this.radius / s);
        stroke(255, 0, 0);
        strokeWeight(2 / s);
        line(0, 0, (this.velocity.x / s) * 5, (this.velocity.y / s) * 5);
        pop();
    }
}