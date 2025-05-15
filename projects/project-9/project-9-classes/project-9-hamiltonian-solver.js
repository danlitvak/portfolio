class hamiltonian_solver {
    constructor(node_graph) {
        this.node_graph = this.node_graph_deep_copy(node_graph);
        this.start_node_id = null;;
        this.working_queue = [];
        this.solutions_set = new Set();
        this.solutions = [];
    }

    // naive solver
    solve() {
        // while there are still states in the working queue
        if (this.working_queue.length === 0) {
            // no more states to explore
            return;
        }
        // pop the first state from the queue
        const current_state = this.working_queue.pop();
        const path = current_state.path;
        const node_graph = current_state.node_graph;

        // check if the path is a solution
        if (this.check_solution(path)) {
            this.push_solution(path);
        }

        // get the last node in the path
        const last_node_id = path[path.length - 1];
        const last_node = node_graph.get(last_node_id);

        // iterate over all connections of the last node
        for (const neighbor of last_node.connections) {
            // check if the neighbor is already in the path
            if (!this.path_contains_node_id(path, neighbor)) {
                // create a new state with the new path and push it into the working queue
                const new_path = [...path, neighbor];
                const new_node_graph = this.node_graph_deep_copy(node_graph);

                // remove connections towards the new node
                this.remove_connections_towards_node(new_node_graph, neighbor);

                const new_state = { path: new_path, node_graph: new_node_graph };
                this.working_queue.push(new_state);
            }
        }
    }

    start_solver(node_graph, start_node_id) {
        this.reset_solver();
        this.node_graph = this.node_graph_deep_copy(node_graph);
        this.start_node_id = start_node_id;
        this.push_innitial_state();
    }

    push_innitial_state() {
        // push the initial state into the working queue
        const initial_state = { path: [this.start_node_id], node_graph: this.node_graph }
        this.working_queue.push(initial_state);
    }

    reset_solver() {
        this.start_node_id = null;
        this.working_queue = [];
        this.solutions_set.clear();
        this.solutions = [];
    }

    path_contains_node_id(path, node_id) {
        // check if the path contains the node id
        return path.some(node => node === node_id);
    }

    remove_connections_towards_node(node_graph, node_id) {
        // remove all connections towards the node
        for (const [key, node] of node_graph.entries()) {
            const index = node.connections.findIndex(neighbor => neighbor === node_id);
            if (index !== -1) {
                node.connections.splice(index, 1);
            }
        }
    }

    node_graph_deep_copy(original_graph) {
        const new_graph = new Map();

        // Step 1: Create a shallow clone of each node (connections left empty for now)
        for (const [key, node] of original_graph.entries()) {
            new_graph.set(key, { id: key, connections: [], highlighted: false, visited: false });
        }

        // Step 2: Populate connections with references to the new graph's nodes
        for (const [key, old_node] of original_graph.entries()) {
            const new_node = new_graph.get(key);

            for (const neighbor of old_node.connections) {
                const neighbor_copy = new_graph.get(neighbor);
                new_node.connections.push(neighbor_copy);
            }
        }

        return new_graph;
    }

    push_solution(potential_path) {
        // check if the solution is already in the set
        const key = potential_path.join(",");
        if (!this.solutions_set.has(key)) {
            this.solutions_set.add(key);
            this.solutions.push([...path]); // store a clone of the path
        }
    }

    check_solution(potential_path) {
        return potential_path.length === this.node_graph.size;
    }
}