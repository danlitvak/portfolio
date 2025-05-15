class node_graph_visualization {
    constructor(node_graph, bound) {
        this.bound = bound; // bound = {x: x, y: y, w: w, h: h}
        this.node_graph = node_graph;
        this.last_stability = 0;

        // locally store pos / vel / acc for each node purely for visualization
        this.node_positions = new Map();
        this.node_velocity = new Map();
        this.node_acceleration = new Map();
        // Initialize positions based on the number of connections
        this.innitialize_node_positions();

        this.p_node_positions = new Map(this.node_positions); // Clone the map
    }

    adjust_graph_positions() {
        // apply a spring force to each node, connections will pull and non connections will push
        this.p_node_positions = new Map(Array.from(this.node_positions.entries()).map(([id, pos]) => [id, { x: pos.x, y: pos.y }]));

        let rest_distance = 0.1; // resting distance of springs
        let spring_constant = 0.15; // spring constant of springs
        let node_mass = 5; // mass of nodes when calculating accelerations
        let dampening = 0.9; // dampening factor for velocity

        this.node_graph.forEach((this_node, this_id) => {
            let this_position = this.node_positions.get(this_id);

            this.node_graph.forEach((other_node, other_id) => {
                if (this_id === other_id) return; // skip calculations of self
                let other_position = this.node_positions.get(other_id);
                let is_connection = connections_contains_id(this_node.connections, other_id); // determine if other is a connection

                // calculate displacement vector
                let displacement_vector = { x: other_position.x - this_position.x, y: other_position.y - this_position.y };
                // magnitude of displacement vector
                let displacement = sqrt(displacement_vector.x * displacement_vector.x + displacement_vector.y * displacement_vector.y);

                // Avoid division by zero
                if (displacement === 0) {
                    displacement = 1e-6; // Small value to prevent division by zero
                }

                // unit vector of direction vector
                let direction_vector = { x: displacement_vector.x / displacement, y: displacement_vector.y / displacement };

                // calculate magnitude of force
                let force;
                if (is_connection) {
                    force = spring_constant * (rest_distance - displacement) * -1;
                } else {
                    force = spring_constant * ((rest_distance * 5) - displacement) * -1;
                    force *= 0.5;
                }
                // calculate force vector from magnitude and direction
                let force_vector = { x: force * direction_vector.x, y: force * direction_vector.y };


                // apply positive force to this node 
                let this_acceleration = this.node_acceleration.get(this_id);
                this_acceleration.x += force_vector.x / node_mass;
                this_acceleration.y += force_vector.y / node_mass;
                this.node_acceleration.set(this_id, this_acceleration);

                // and negative force to other node
                let other_acceleration = this.node_acceleration.get(other_id);
                other_acceleration.x -= force_vector.x / node_mass;
                other_acceleration.y -= force_vector.y / node_mass;
                this.node_acceleration.set(other_id, other_acceleration);
            });
        });

        // update accelerations -> velocities -> positions
        this.node_graph.forEach(node => {
            // references to simplify code a little
            let velocity = this.node_velocity.get(node.id);
            let position = this.node_positions.get(node.id);
            let acceleration = this.node_acceleration.get(node.id);

            // clamp acceleration to a maximum value
            let max_acceleration = 0.01;
            acceleration.x = constrain(acceleration.x, -max_acceleration, max_acceleration);
            acceleration.y = constrain(acceleration.y, -max_acceleration, max_acceleration);

            // clamp velocity to a maximum value
            let max_velocity = 0.01;
            velocity.x = constrain(velocity.x, -max_velocity, max_velocity);
            velocity.y = constrain(velocity.y, -max_velocity, max_velocity);

            // clamp position to a maximum value
            position.x = constrain(position.x, 0, 1);
            position.y = constrain(position.y, 0, 1);

            // add acceleration to velocity
            velocity.x += acceleration.x;
            velocity.y += acceleration.y;


            // add velocity to position
            position.x += velocity.x;
            position.y += velocity.y;

            // dampen velocity to simulate friction
            velocity.x *= dampening;
            velocity.y *= dampening;

            // slowly add to positions to make sure to center the graph
            position.x = lerp(position.x, 0.5, 0.01);
            position.y = lerp(position.y, 0.5, 0.01);

            // reset accelerations
            acceleration.x = 0;
            acceleration.y = 0;

            this.node_velocity.set(node.id, velocity);
            this.node_positions.set(node.id, position);
            this.node_acceleration.set(node.id, acceleration);
        });

        // Calculate total change in positions to quantify graph stability
        let total_change = 0;
        for (let [id, pos] of this.node_positions.entries()) {
            let p_pos = this.p_node_positions.get(id);
            total_change += dist(pos.x, pos.y, p_pos.x, p_pos.y);
        }
        this.last_stability = total_change;
        return total_change;
    }

    innitialize_node_positions() {
        node_graph.forEach((node, id) => {
            const connection_count = node.connections.length;
            const max_connections = Math.max(...Array.from(node_graph.values()).map(n => n.connections.length));

            // Map connection count to a range where more connections are closer to the center
            const distance_from_center = map(connection_count, 0, max_connections, 1, 0);

            // Randomize the angle for placement around the center
            const angle = random(TWO_PI);
            const x = 0.5 + cos(angle) * distance_from_center * 0.5;
            const y = 0.5 + sin(angle) * distance_from_center * 0.5;

            this.node_positions.set(id, { x, y });

            this.node_velocity.set(id, { x: 0, y: 0 });
            this.node_acceleration.set(id, { x: 0, y: 0 });
        });
    }

    draw_node_graph(pos, zoom) {
        push();

        noFill();
        stroke(255);
        strokeWeight(1);
        rect(this.bound.x, this.bound.y, this.bound.w, this.bound.h);

        // show the last stability of the graph
        push();
        fill(255);
        noStroke();
        textAlign(LEFT, TOP);
        textSize(12);
        text("Graph Stability: " + this.last_stability.toFixed(4), this.bound.x + 5, this.bound.y + 5);
        pop();

        // show position and zoom of the graph
        push();
        fill(255);
        noStroke();
        textAlign(LEFT, BOTTOM);
        textSize(12);
        text("Graph Position: " + pos.x.toFixed(4) + ", " + pos.y.toFixed(4), this.bound.x + 5, this.bound.y + this.bound.h - 5);
        text("Graph Zoom: " + zoom.x.toFixed(4) + ", " + zoom.y.toFixed(4), this.bound.x + 5, this.bound.y + this.bound.h - 20);
        pop();


        // first draw connecting lines
        this.node_graph.forEach((this_node, id) => {
            if (this_node.connections) {
                this_node.connections.forEach(other_node_id => {
                    // create line from this_node to other_node
                    this.draw_line_from_id(id, other_node_id);
                });
            }
        });

        // then draw over with circles for the nodes over the lines
        fill(255);
        noStroke();
        this.node_graph.forEach((this_node, id) => {
            this.draw_node_from_id(id, 10);
        });

        pop();
    }

    highlight_nearest_node(target_pos, zoom) {
        let min_valid_dist = 0.1 / ((zoom.x + zoom.y) / 2); // Minimum distance to consider a node valid
        let nearest_id = null;
        let nearest_dist = Infinity; // Corrected to start with Infinity for proper comparison

        this.node_graph.forEach((node, id) => {
            node.highlighted = false; // Reset all nodes to not highlighted
            let test_dist = dist(target_pos.x, target_pos.y, this.node_positions.get(id).x, this.node_positions.get(id).y);

            if (test_dist < nearest_dist) {
                nearest_dist = test_dist;
                nearest_id = id;
            }
        });

        if (nearest_dist < min_valid_dist && nearest_id !== null) {
            this.node_graph.get(nearest_id).highlighted = true;
            return nearest_id; // Return the nearest node ID
        } else {
            return null; // No valid nearest node found
        }
    }

    draw_node_from_id(id, radius) {
        let x = this.get_draw_x(this.node_positions.get(id).x);
        let y = this.get_draw_y(this.node_positions.get(id).y);

        // find the node by id using Map
        let node = this.node_graph.get(id);

        // if node not found, return
        if (!node) return;

        let is_highlighted = node.highlighted;

        if (is_highlighted) {
            fill(0, 255, 0);
            radius *= 1.5;
        } else {
            fill(255, 255, 255);
        }

        ellipse(x, y, radius, radius);

        stroke(255);
        fill(0);
        textAlign(CENTER, CENTER);
        text(id, x, y);
    }

    draw_line_from_id(id_1, id_2) {
        let x1 = this.get_draw_x(this.node_positions.get(id_1).x);
        let y1 = this.get_draw_y(this.node_positions.get(id_1).y);
        let x2 = this.get_draw_x(this.node_positions.get(id_2).x);
        let y2 = this.get_draw_y(this.node_positions.get(id_2).y);

        line(x1, y1, x2, y2);
    }

    get_draw_x(x) {
        return map(x, 0, 1, this.bound.x, this.bound.x + this.bound.w);
    }

    get_draw_y(y) {
        return map(y, 0, 1, this.bound.y, this.bound.y + this.bound.h);
    }
}