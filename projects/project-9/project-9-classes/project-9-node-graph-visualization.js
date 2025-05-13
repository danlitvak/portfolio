class node_graph_visualization {
    constructor(node_graph, bound) {
        this.bound = bound; // bound = {x: x, y: y, w: w, h: h}
        this.node_graph = node_graph;
        this.node_positions = [];
        // innitialize positions randomly
        node_graph.forEach(node => {
            this.node_positions[node.id] = { x: random(), y: random() };
        });
    }

    adjust_graph_positions() {
        // each node will want to be closer to its connections
        // simple solution: move them proportional to distance away
        let rest_dist = 0.1;

        this.node_graph.forEach(this_node => {
            if (this_node.connections.length) {
                // accumulate adjustments needed
                let adjust = { x: 0, y: 0 };
                this_node.connections.forEach(other_node => {
                    // displacement vector = other.pos - this.pos
                    // displacement vector give the direction of adjustment
                    let d_vec = { x: 0, y: 0 };

                    d_vec.x = this.node_positions[other_node.id].x - this.node_positions[this_node.id].x;
                    d_vec.y = this.node_positions[other_node.id].y - this.node_positions[this_node.id].y;

                    if (sqrt(d_vec.x * d_vec.x + d_vec.y * d_vec.y) < rest_dist) {
                        d_vec.x *= -1;
                        d_vec.y *= -1;
                    }

                    adjust.x += d_vec.x;
                    adjust.y += d_vec.y;
                });

                // take average of adjustments
                adjust.x /= this_node.connections.length;
                adjust.y /= this_node.connections.length;

                // adjustment rate
                adjust.x /= 50;
                adjust.y /= 50;

                this.node_positions[this_node.id].x += adjust.x;
                this.node_positions[this_node.id].y += adjust.y;
            }
        });
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
        this.node_graph.forEach(this_node => {
            this.draw_node_from_id(this_node.id, 10);
        });

        pop();
    }


    draw_node_from_id(id, radius) {
        let x = this.get_draw_x(this.node_positions[id].x);
        let y = this.get_draw_y(this.node_positions[id].y);

        ellipse(x, y, radius, radius);
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