class node_graph_visualization {
    constructor(node_graph, bound) {
        this.bound = bound; // bound = {x: x, y: y, w: w, h: h}
        this.node_graph = node_graph;

        // locally store pos / vel / acc for each node purely for visualization
        this.node_positions = [];
        this.node_velocity = [];
        this.node_acceleration = [];
        // innitialize positions randomly
        node_graph.forEach(node => {
            this.node_positions[node.id] = { x: random(), y: random() };
            this.node_velocity[node.id] = { x: 0, y: 0 };
            this.node_acceleration[node.id] = { x: 0, y: 0 };
        });
        this.p_node_positions = this.node_positions.slice();
    }

    adjust_graph_positions() {
        // apply a spring force to each node, connections will pull and non connections will push
        this.p_node_positions = this.node_positions.map(pos => ({ x: pos.x, y: pos.y }));

        let rest_distance = 0.1; // resting distance of springs
        let spring_constant = 0.3; // spring constant of springs
        let node_mass = 3; // mass of nodes when calculating accelerations
        let dampening = 0.9;

        this.node_graph.forEach(this_node => {
            let this_id = this_node.id;
            let this_position = this.node_positions[this_id];

            this.node_graph.forEach(other_node => {
                let other_id = other_node.id;
                if (this_id == other_id) return; // skip calculations of self
                let other_position = this.node_positions[other_id];
                let is_connection = this_node.connections_contains_id(other_id); // determine if other is a connection

                // calculate displacement vector
                let displacement_vector = { x: other_position.x - this_position.x, y: other_position.y - this_position.y }
                // magnitude of displacement vector
                let displacement = sqrt(displacement_vector.x * displacement_vector.x + displacement_vector.y * displacement_vector.y);
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
                this.node_acceleration[this_id].x += force_vector.x / node_mass;
                this.node_acceleration[this_id].y += force_vector.y / node_mass;
                // and negative force to other node
                this.node_acceleration[other_id].x -= force_vector.x / node_mass;
                this.node_acceleration[other_id].y -= force_vector.y / node_mass;
            });
        });

        // update accelerations -> velocities -> positions
        this.node_graph.forEach(node => {
            // references to simplify code a little
            let velocity = this.node_velocity[node.id];
            let position = this.node_positions[node.id];
            let acceleration = this.node_acceleration[node.id];

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
        });

        // Calculate total change in positions to quantify graph stability
        let total_change = 0;
        for (let i = 0; i < this.node_positions.length; i++) {
            let pos = this.node_positions[i];
            let p_pos = this.p_node_positions[i];

            total_change += dist(pos.x, pos.y, p_pos.x, p_pos.y);
        }
        return total_change;
    }

    show_node_graph() {
        push();

        noFill();
        stroke(255);
        strokeWeight(1);
        rect(this.bound.x, this.bound.y, this.bound.w, this.bound.h);

        // first draw connecting lines
        this.node_graph.forEach(this_node => {
            if (this_node.connections) {
                this_node.connections.forEach(other_node => {
                    // create line from this_node to other_node
                    this.draw_line_from_id(this_node.id, other_node.id);
                });
            }
        });

        // then draw over with circles for the nodes over the lines
        fill(255);
        noStroke();
        this.node_graph.forEach(this_node => {
            this.draw_node_from_id(this_node.id, 10);
        });

        pop();
    }

    highlight_nearest_node(target_pos) {
        // init to random one
        let min_valid_dist = 0.1;
        let nearest_id = this.node_graph[0].id;
        let nearest_dist = dist(target_pos.x, target_pos.y, this.node_positions[nearest_id].x, this.node_positions[nearest_id].y);

        this.node_graph.forEach(node => {
            node.highlighted = false; // set all to false, then at the end set the nearest to true
            let test_id = node.id;
            let test_dist = dist(target_pos.x, target_pos.y, this.node_positions[test_id].x, this.node_positions[test_id].y);

            if (test_dist < nearest_dist) {
                nearest_dist = test_dist;
                nearest_id = test_id;
            }
        });

        if (nearest_dist < min_valid_dist) {
            this.node_graph[nearest_id].highlighted = true;
            return nearest_id; // return nearest id for use of solving
        } else {
            return null;
        }
    }


    draw_node_from_id(id, radius) {
        let x = this.get_draw_x(this.node_positions[id].x);
        let y = this.get_draw_y(this.node_positions[id].y);

        let node = this.node_graph[id];

        if (!node) return;

        let is_highlighted = node.highlighted;

        if (is_highlighted) {
            fill(0, 255, 0);
            radius *= 1.5;
        } else {
            fill(255, 255, 255);
        }

        ellipse(x, y, radius, radius);

        stroke(255)
        fill(0);
        textAlign(CENTER, CENTER)
        text(id, x, y);
    }

    draw_line_from_id(id_1, id_2) {
        let x1 = this.get_draw_x(this.node_positions[id_1].x);
        let y1 = this.get_draw_y(this.node_positions[id_1].y);
        let x2 = this.get_draw_x(this.node_positions[id_2].x);
        let y2 = this.get_draw_y(this.node_positions[id_2].y);

        line(x1, y1, x2, y2);
    }

    get_draw_x(x) {
        return map(x, 0, 1, this.bound.x, this.bound.x + this.bound.w);
    }

    get_draw_y(y) {
        return map(y, 0, 1, this.bound.y, this.bound.y + this.bound.h);
    }
}