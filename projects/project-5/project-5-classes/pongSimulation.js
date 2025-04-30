class pongSimulation {
    constructor(bound, b_s, net, debug, id) {
        this.bound = bound; // simulation and visual bound
        this.v_bound = b_s; // visual bound
        this.net = net; // neural network for the left paddle
        this.debug = debug; // debug mode
        this.id = id; // id of the pong simulation

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
        this.ball_diameter = 0.03 * this.bound.w;
        this.ball_speed = 0.015 * this.bound.w;
        // ball variables
        this.ball_pos = new p5.Vector(this.bound.w / 2, this.bound.h / 2);
        // Randomize ball direction (left or right)
        let angleOffset = radians(random() * 120 - 60); // convert degrees to radians
        if (random() < 0.5) {
            angleOffset += PI; // flip direction
        }
        this.ball_vel = p5.Vector.fromAngle(angleOffset).mult(this.ball_speed);

        // Game constants
        this.punishment = 500; // punishment for missing the ball
        this.score_reward = 1000; // reward for scoring
        this.bounce_reward = 100; // reward for bouncing the ball
        this.ball_sleep_time = 120; // time to sleep after scoring (frames ~about 2 seconds)
        this.time_to_move = this.ball_sleep_time; // time to sleep untill moving after scoring (frames)

        // game variables
        this.left_score = 0; // left player score
        this.right_score = 0; // right player score
        this.last_accuracy = 0; // last accuracy of the left paddle
        this.total_fitness = 0; // total fitness of the left paddle (starts at 0)
        this.fitness_history = []; // history of the fitness of the left paddle

        this.reset_game(); // reset game to start
    }

    // Calculate the score for the left paddle
    calculate_left_paddle_score() {
        // Reward based on the vertical distance between the ball and the center of the left paddle
        const paddle_center = this.left_paddle_pos + this.paddle_height / 2;
        const vertical_distance = Math.abs(this.ball_pos.y - paddle_center);

        // Normalize the vertical distance
        const max_distance = this.bound.h - (this.paddle_height / 2);
        const normalized_vertical_distance = vertical_distance > max_distance
            ? 0
            : 1 - (vertical_distance / max_distance); // Closer = higher score

        // Calculate the horizontal distance to the paddle
        // const horizontal_distance = Math.max(0, this.left_paddle_edge - this.ball_pos.x);
        const horizontal_distance = 1;

        // Normalize the horizontal distance
        const normalized_horizontal_distance = 1 - (horizontal_distance / this.bound.w); // Closer = higher weight

        // Weight the vertical distance score based on the horizontal distance
        const weighted_vertical_score = pow(normalized_vertical_distance * normalized_horizontal_distance, 2); // Square the score for more sensitivity

        this.last_accuracy = weighted_vertical_score; // Store the last accuracy for debugging
        if (this.time_to_move <= 0) {
            this.total_fitness += this.last_accuracy / 2; // Update total fitness
        }
        return weighted_vertical_score;
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

    // Return the current state of the game as a normalized array of values
    // Variation 1: includes opponent paddle position
    return_state_1() {
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

    // Variation 2: excludes opponent paddle position
    return_state_2() {
        return [
            this.left_paddle_pos / this.bound.h, // Normalized left paddle position
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

    // Show the pong simulation and neural network
    show() {
        if (this.debug) {
            push();
            this.net.show(); // Show the neural network
            pop();
        }

        translate(this.bound.x, this.bound.y); // translate to top left corner

        // show ID near top left corner
        push();
        noStroke();
        fill(255);
        textSize(0.06 * this.bound.w); // Adjust text size relative to game width
        text(
            `ID: ${this.id}`, // ID of the pong simulation
            0.08 * this.bound.w, // Left
            0.04 * this.bound.w // Top
        );
        pop();

        // draw center line
        stroke(128);
        line(this.bound.w / 2, 0, this.bound.w / 2, this.bound.h);

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
            let state = this.return_state_2();
            let state_width = 0.04 * this.bound.w;
            translate((this.bound.w - state_width * state.length) / 2, state_width);
            noStroke();
            fill(255);
            textSize(0.03 * this.bound.w);
            text("Current State:", 0, -state_width, state_width * state.length, state_width);
            stroke(255);
            strokeWeight(2);
            state.forEach((val, i) => {
                if (val == 1) {
                    fill(0, 0, 255);
                } else if (val == 0) {
                    fill(255, 0, 0);
                } else {
                    fill(val * 255);
                }
                rect(i * state_width, 0, state_width, state_width);
            });
            pop();

            // Show history of fitness
            push();
            stroke(255, 128);
            strokeWeight(2);
            // line(0, this.bound.h / 2, this.bound.w, this.bound.h / 2);
            let smallest = min(this.fitness_history);
            let largest = max(this.fitness_history);
            let step = this.bound.w / this.fitness_history.length;
            for (let i = 0; i < this.fitness_history.length - 1; i++) {
                let x1 = i * step;
                let y1 = map(this.fitness_history[i], smallest, largest, this.bound.h, 0);
                let x2 = (i + 1) * step;
                let y2 = map(this.fitness_history[i + 1], smallest, largest, this.bound.h, 0);
                if (this.fitness_history[i] > this.fitness_history[i + 1]) {
                    stroke(255, 0, 0, 128);
                } else {
                    stroke(0, 255, 0, 128);
                }
                line(x1, y1, x2, y2);
            }
            pop();
        }

        push();
        noStroke();
        fill(255);
        // Draw the last accuracy in the middle
        textSize(0.04 * this.bound.w); // Adjust text size relative to game width
        text(
            `Accuracy: ${this.last_accuracy.toFixed(2)}`, // Last accuracy
            this.bound.w / 2, // Center of the canvas
            (1 / 3) * this.bound.h
        );

        // Draw the total fitness in the middle
        textSize(0.06 * this.bound.w); // Adjust text size relative to game width
        text(
            `Total Fitness: ${this.total_fitness.toFixed(2)}`, // Total fitness
            this.bound.w / 2, // Center of the canvas
            (1 / 3 + 0.04) * this.bound.h
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

        if (this.debug) {
            // draw paddle directions
            // Draw paddle direction for the left paddle
            push();
            translate(this.paddle_offest + this.paddle_width / 2, this.left_paddle_pos + this.paddle_height / 2);
            if (this.debug) {
                stroke(128, 0, 0);
                strokeWeight(1);
                line(0, 0, 0, this.left_paddle_vel * ((this.paddle_height / 2) / this.paddle_max_vel));
            }
            pop();

            // Draw paddle direction for the right paddle
            push();
            translate(this.right_paddle_edge + this.paddle_width / 2, this.right_paddle_pos + this.paddle_height / 2);
            if (this.debug) {
                stroke(0, 0, 128);
                strokeWeight(1);
                line(0, 0, 0, this.right_paddle_vel * ((this.paddle_height / 2) / this.paddle_max_vel));
            }
            pop();
        }

        // draw ball
        push();
        if (this.time_to_move > 0) {
            noFill();
            stroke(255);
            strokeWeight(1);
        } else {
            fill(255);
            noStroke();
        }

        translate(this.ball_pos.x, this.ball_pos.y);
        circle(0, 0, this.ball_diameter);
        if (this.debug) {
            stroke(255, 0, 0);
            line(0, 0, this.ball_vel.x * 2, this.ball_vel.y * 2);
        }
        pop();

        // Show scores in two separate text boxes
        push();
        textAlign(CENTER, CENTER);
        noStroke();
        textSize(0.05 * this.bound.w); // Adjust text size relative to game width
        fill(255);

        // Left score (centered in the left half)
        text(
            `${this.left_score}`, // Left player's score
            this.bound.w / 4, // Center of the left half
            (1 / 3) * this.bound.h // Near the top
        );

        // Right score (centered in the right half)
        text(
            `${this.right_score}`, // Right player's score
            (3 * this.bound.w) / 4, // Center of the right half
            (1 / 3) * this.bound.h // Near the top
        );
        pop();
    }

    show_visual() {
        if (this.debug) {
            push();
            this.net.show(); // Show the neural network
            pop();
        }

        translate(this.v_bound.x, this.v_bound.y); // translate to top left corner

        // show ID near top left corner
        push();
        noStroke();
        fill(255);
        textSize(0.06 * this.v_bound.w); // Adjust text size relative to game width
        text(
            `ID: ${this.id}`, // ID of the pong simulation
            0.08 * this.v_bound.w, // Left
            0.04 * this.v_bound.w // Top
        );
        pop();

        // draw center line
        stroke(128);
        line(this.v_bound.w / 2, 0, this.v_bound.w / 2, this.v_bound.h);

        // draw vertical / horizontal debug lines
        if (this.debug) {
            stroke(128, 0, 0);


            stroke(0, 0, 128);
        }
    }

    // Clamp the paddle positions to within the bounds of the game
    clamp_paddles() {
        this.left_paddle_pos = max(0, min(this.left_paddle_pos, this.bound.h - this.paddle_height));
        this.right_paddle_pos = max(0, min(this.right_paddle_pos, this.bound.h - this.paddle_height));
    }

    // Update the ball position and check for collisions
    update(d_score, perfect_play) {
        if (abs(this.left_score - this.right_score) > d_score) {
            return;
        }

        this.net.forward_propagate(this.return_state_2()); // propagate the neural network with the pong state
        let output = this.net.output(); // get the output of the neural network
        this.move_left_paddle(output * (this.bound.h - this.paddle_height)); // move left paddle to network output
        if (perfect_play) {
            this.move_right_paddle(this.ball_pos.y - this.paddle_height / 2); // move right paddle to ball position (perfect play)
        }
        this.clamp_paddles(); // clamp paddles to withen the bounds
        this.calculate_left_paddle_score();


        // add fitness to history
        this.fitness_history.push(this.total_fitness);
        if (this.fitness_history.length > 500) {
            this.fitness_history.shift();
        }

        // calculate small step
        let step_size = 1;
        let dv = p5.Vector.setMag(this.ball_vel, step_size)

        for (let s = 0; s < this.ball_vel.mag(); s += dv.mag()) {
            let prev_pos = this.ball_pos.copy();

            if (this.time_to_move < 0) {
                this.ball_pos.add(dv);
            } else {
                this.time_to_move -= 1;
            }

            if (this.check_intersection(prev_pos)) {
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
            this.total_fitness -= this.punishment; // Apply punishment for missing the ball
            this.reset_game();
        }

        // Bounce off right wall (if not intercepted by paddle)
        if (this.ball_pos.x + r >= this.bound.w) {
            this.ball_pos.x = this.bound.w - r;
            this.ball_vel.x *= -1;
            bounced = true;
            this.left_score++;
            this.total_fitness += this.score_reward; // Apply reward for scoring
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
            this.total_fitness += this.bounce_reward; // Apply reward for bouncing the ball
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

        // update ball velocity direction
        if (abs(this.ball_vel.y / this.ball_vel.x) > 2) {
            this.ball_vel.x *= random(1, 2);
            this.ball_vel.setMag(this.ball_speed);
        }

        if (bounced) {
            this.applyJitter(this.ball_vel, 10, 30); // Apply jitter to the ball's vertical velocity
        }


        return bounced;
    }

    // Reset the game after a score
    reset_game() {
        // Reset ball position to the center
        this.ball_pos = new p5.Vector(this.bound.w / 2, this.bound.h / 2);

        // Randomize ball direction (left or right)
        let angleOffset = radians(random() * 120 - 60); // convert degrees to radians
        if (random() < 0.5) {
            angleOffset += PI; // flip direction
        }
        this.ball_vel = p5.Vector.fromAngle(angleOffset).mult(this.ball_speed);

        // Reset paddle positions
        this.left_paddle_pos = (this.bound.h - this.paddle_height) / 2; // Center left paddle vertically
        this.right_paddle_pos = (this.bound.h - this.paddle_height) / 2; // Center right paddle vertically

        this.time_to_move = this.ball_sleep_time; // Reset time to move the ball
    }

    // Hard reset the game (history, score, NN.weights, NN.biases)
    hard_reset() {
        this.left_score = 0;
        this.right_score = 0;
        this.total_fitness = 0;
        this.fitness_history = [];
        this.net.rand_reset_network(); // Reset the neural network
        this.reset_game(); // Reset the game
    }

    // Soft reset after NN update or new generation (history, score)
    soft_reset() {
        this.left_score = 0;
        this.right_score = 0;
        this.total_fitness = 0;
        this.fitness_history = [];
        this.reset_game(); // Reset the game
    }

    // Apply jitter to the ball's vertical velocity
    applyJitter(vel, minAngleOffset = 5, maxAngleOffset = 25) {
        // Convert velocity to angle
        let angle = vel.heading();

        // Check if the angle is too close to vertical (90° or 270°) or horizontal (0° or 180°)
        if (abs(sin(angle)) < 0.2 || abs(cos(angle)) < 0.2) {
            // Add a small random offset to the angle to avoid direct vertical or horizontal bounces
            let offset = radians(random(minAngleOffset, maxAngleOffset)) * (random() < 0.5 ? 1 : -1);
            angle += offset;
        }

        // Ensure the angle is within a shallow range to avoid 45-degree bounces
        let shallowOffset = radians(random(-15, 15)); // Random shallow adjustment
        angle += shallowOffset;

        // Update the velocity vector with the adjusted angle
        vel.set(p5.Vector.fromAngle(angle).mult(this.ball_speed));
    }
}