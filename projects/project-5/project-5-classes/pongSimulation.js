class pongSimulation {
    constructor(bound) {
        this.bound = bound;
        this.debug = true;

        //  paddle constants (maybe should convert to percentages)
        this.paddle_offest = 0.04 * this.bound.w; // offset units relative to respective wall
        this.paddle_width = 0.02 * this.bound.w; // unit width of the paddles
        this.paddle_height = 0.3 * this.bound.w; // unit height of the paddles
        this.paddle_max_vel = 0.02 * this.bound.h; // max velocity of the paddles
        // paddle variables
        // left paddle
        this.left_paddle_pos = 0; // top of the right paddle
        this.left_paddle_edge = this.paddle_offest + this.paddle_width; // right edge of left paddle (const)
        this.left_paddle_vel = 0; // velocity of the left paddle
        // right paddle
        this.right_paddle_pos = 0; // top of the left paddle
        this.right_paddle_edge = this.bound.w - (this.paddle_offest + this.paddle_width); // left edge of right paddle (const)
        this.right_paddle_vel = 0; // velocity of the right paddle

        // ball constants
        this.ball_diameter = 0.02 * this.bound.w;
        this.ball_speed = 0.015 * this.bound.w; 
        // ball variables
        this.ball_pos = new p5.Vector(this.bound.w / 2, this.bound.h / 2);
        let side = random() < 0.5 ? 1 : -1; // launch left or right
        let angleOffset = radians(random(-60, 60)); // convert degrees to radians
        let angle = side * angleOffset;
        this.ball_vel = p5.Vector.fromAngle(angle).mult(this.ball_speed);

        // game variables
        this.left_score = 0; // left player score
        this.right_score = 0; // right player score

        this.reset_game(); // reset game to start
    }

    // Move the left paddle up or down to a target position
    move_left_paddle(target_pos) {
        // Calculate the distance to the target position
        let dist = target_pos - this.left_paddle_pos;

        // Move the paddle towards the target position
        if (dist > 0) {
            this.left_paddle_vel = min(this.paddle_max_vel, dist);
            this.left_paddle_pos += this.left_paddle_vel;
        } else {
            this.left_paddle_vel = max(-this.paddle_max_vel, dist);
            this.left_paddle_pos += this.left_paddle_vel;
        }
    }

    // Move the right paddle up or down to a target position
    move_right_paddle(target_pos) {
        // Calculate the distance to the target position
        let dist = target_pos - this.right_paddle_pos;

        // Move the paddle towards the target position
        if (dist > 0) {
            this.right_paddle_vel = min(this.paddle_max_vel, dist);
            this.right_paddle_pos += this.right_paddle_vel;
        } else {
            this.right_paddle_vel = max(-this.paddle_max_vel, dist);
            this.right_paddle_pos += this.right_paddle_vel;
        }
    }

    return_state() {
        // Outputs the current state of the game as a normalized array of values
        return [
            this.left_paddle_pos / this.bound.h, // Normalized left paddle position
            this.right_paddle_pos / this.bound.h, // Normalized right paddle position
            this.ball_pos.x / this.bound.w, // Normalized ball x position
            this.ball_pos.y / this.bound.h, // Normalized ball y position
            this.ball_vel.x / this.ball_speed, // Normalized ball x velocity
            this.ball_vel.y / this.ball_speed, // Normalized ball y velocity
            (this.ball_pos.x - this.left_paddle_edge) / this.bound.w, // Horizontal distance to left paddle
            (this.right_paddle_edge - this.ball_pos.x) / this.bound.w, // Horizontal distance to right paddle
            (this.ball_pos.y - (this.left_paddle_pos + this.paddle_height / 2)) / this.bound.h, // Vertical distance to left paddle center
            (this.ball_pos.y - (this.right_paddle_pos + this.paddle_height / 2)) / this.bound.h, // Vertical distance to right paddle center
            this.ball_vel.x > 0 ? 1 : 0 // Ball direction (1 = right, 0 = left)
        ];
    }

    show() {
        push();
        translate(this.bound.x, this.bound.y); // translate to top left corner

        // draw center line
        stroke(128);
        line(this.bound.w / 2, 0, this.bound.w / 2, this.bound.h)

        // debug lines
        if (this.debug) {
            // vertical / horizontal lines
            stroke(128, 0, 0)
            line(this.left_paddle_edge, this.left_paddle_pos + this.paddle_height / 2, this.bound.w, this.left_paddle_pos + this.paddle_height / 2);
            line(this.left_paddle_edge - this.paddle_width / 2, 0, this.left_paddle_edge - this.paddle_width / 2, this.bound.h);
            stroke(0, 0, 128)
            line(this.right_paddle_edge, this.right_paddle_pos + this.paddle_height / 2, 0, this.right_paddle_pos + this.paddle_height / 2);
            line(this.right_paddle_edge + this.paddle_width / 2, 0, this.right_paddle_edge + this.paddle_width / 2, this.bound.h);

            // current state output
            push();
            let state = this.return_state();
            let state_width = 0.04 * this.bound.w;
            translate((this.bound.w - state_width * state.length) / 2, state_width);
            noStroke();
            fill(255);
            textSize(0.03 * this.bound.w);
            text("Current State:", 0, -state_width, state_width * state.length, state_width);
            stroke(255);
            strokeWeight(2);
            state.forEach((val, i) => {
                if(val == 1){
                    fill(0, 0, 255);
                }else if(val == 0){
                    fill(255, 0, 0);
                }else{
                    fill(val * 255);
                }
                rect(i * state_width, 0, state_width, state_width);
            });
            pop();

            // Show scores in two separate text boxes
            push();
            textAlign(CENTER, CENTER);
            textSize(0.05 * this.bound.w); // Adjust text size relative to game width
            fill(255);

            // Left score (centered in the left half)
            text(
                `${this.left_score}`, // Left player's score
                this.bound.w / 4, // Center of the left half
                (1/3) * this.bound.h // Near the top
            );

            // Right score (centered in the right half)
            text(
                `${this.right_score}`, // Right player's score
                (3 * this.bound.w) / 4, // Center of the right half
                (1/3) * this.bound.h // Near the top
            );
            pop();


            // draw bounding box of game
            noFill();
            stroke(255);
            strokeWeight(2);
            rect(0, 0, this.bound.w, this.bound.h);

            // draw left paddle
            fill(255);
            noStroke();
            rect(this.paddle_offest, this.left_paddle_pos, this.paddle_width, this.paddle_height);

            // draw right paddle
            fill(255);
            noStroke();
            rect(this.right_paddle_edge, this.right_paddle_pos, this.paddle_width, this.paddle_height);

            // draw paddle direction
            push();
            // Draw paddle direction for the left paddle
            push();
            translate(this.paddle_offest + this.paddle_width / 2, this.left_paddle_pos + this.paddle_height / 2);
            if (this.debug) {
                stroke(255, 0, 0);
                strokeWeight(2);
                line(0, 0, 0, this.left_paddle_vel * ((this.paddle_height / 2) / this.paddle_max_vel));
            }
            pop();

            // Draw paddle direction for the right paddle
            push();
            translate(this.right_paddle_edge + this.paddle_width / 2, this.right_paddle_pos + this.paddle_height / 2);
            if (this.debug) {
                stroke(0, 0, 255);
                strokeWeight(2);
                line(0, 0, 0, this.right_paddle_vel * ((this.paddle_height / 2) / this.paddle_max_vel));
            }
            pop();

            pop();

            // draw ball
            push();
            fill(255);
            noStroke();
            translate(this.ball_pos.x, this.ball_pos.y);
            circle(0, 0, this.ball_diameter);
            if (this.debug) {
                stroke(255, 0, 0);
                line(0, 0, this.ball_vel.x * 2, this.ball_vel.y * 2);
            }
            pop();
            pop();
        }
    }

    clamp_paddles() {
        this.left_paddle_pos = max(0, min(this.left_paddle_pos, this.bound.h - this.paddle_height));
        this.right_paddle_pos = max(0, min(this.right_paddle_pos, this.bound.h - this.paddle_height));
    }

    // Update the ball position and check for collisions
    update() {
        // calculate small step
        let step_size = 1;
        let dv = p5.Vector.setMag(this.ball_vel, step_size)

        for (let s = 0; s < this.ball_vel.mag(); s += dv.mag()) {
            let prev_pos = this.ball_pos.copy();
            this.ball_pos.add(dv);
            if (this.check_intersection(prev_pos)) {
                this.applyYJitter(this.ball_vel);
                return;
            }
        }
    }

    // Check for intersection with walls and paddles
    check_intersection(prev_pos) {
        let bounced = false;
        const r = this.ball_diameter / 2;

        // Bounce off top wall
        if (this.ball_pos.y - r <= 0) {
            this.ball_pos.y = r;
            this.ball_vel.y *= -1;
            bounced = true;
        }

        // Bounce off bottom wall
        if (this.ball_pos.y + r >= this.bound.h) {
            this.ball_pos.y = this.bound.h - r;
            this.ball_vel.y *= -1;
            bounced = true;
        }

        // Bounce off left wall (if not intercepted by paddle)
        if (this.ball_pos.x - r <= 0) {
            this.ball_pos.x = r;
            this.ball_vel.x *= -1;
            bounced = true;
            this.right_score++;
            this.reset_game();
        }

        // Bounce off right wall (if not intercepted by paddle)
        if (this.ball_pos.x + r >= this.bound.w) {
            this.ball_pos.x = this.bound.w - r;
            this.ball_vel.x *= -1;
            bounced = true;
            this.left_score++;
            this.reset_game();
        }

        // Left paddle collision
        if (
            prev_pos.x - r > this.left_paddle_edge && // was in front of paddle
            this.ball_pos.x - r <= this.left_paddle_edge && // crossed paddle edge
            this.ball_pos.y >= this.left_paddle_pos &&
            this.ball_pos.y <= this.left_paddle_pos + this.paddle_height &&
            this.ball_vel.x < 0
        ) {
            this.ball_pos.x = this.left_paddle_edge + r;
            this.ball_vel.x *= -1;
            bounced = true;
        }

        // Right paddle collision
        if (
            prev_pos.x + r < this.right_paddle_edge && // was in front of paddle
            this.ball_pos.x + r >= this.right_paddle_edge && // crossed into paddle
            this.ball_pos.y >= this.right_paddle_pos &&
            this.ball_pos.y <= this.right_paddle_pos + this.paddle_height &&
            this.ball_vel.x > 0
        ) {
            this.ball_pos.x = this.right_paddle_edge - r;
            this.ball_vel.x *= -1;
            bounced = true;
        }

        return bounced;
    }

    reset_game() {
        // Reset ball position to the center
        this.ball_pos = new p5.Vector(this.bound.w / 2, this.bound.h / 2);
    
        // Randomize ball direction (left or right)
        let side = random() < 0.5 ? 1 : -1; // launch left or right
        let angleOffset = radians(random(-60, 60)); // convert degrees to radians
        let angle = side * angleOffset;
        this.ball_vel = p5.Vector.fromAngle(angle).mult(this.ball_speed);
    
        // Reset paddle positions
        this.left_paddle_pos = (this.bound.h - this.paddle_height) / 2; // Center left paddle vertically
        this.right_paddle_pos = (this.bound.h - this.paddle_height) / 2; // Center right paddle vertically
    }

    // Apply jitter to the ball's vertical velocity
    applyYJitter(vel, maxYJitter = 1) {
        vel.y += random(-maxYJitter, maxYJitter);
        vel.setMag(this.ball_speed); // reset to constant speed
    }
}